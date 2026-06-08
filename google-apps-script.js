// ================================================================
// CATEQUESE VIGARARIA — Google Apps Script Backend
// Deploy: Executar como "Eu" | Acesso: "Qualquer pessoa"
// ================================================================

// ✅ ID CORRECTO — directo, sem PropertiesService
var SPREADSHEET_ID = '1r-A_LBu_auTh2VaA_0Z4D6XYcNrC8XbKmW-jDVR6BF4';

// ── Entry Point ──────────────────────────────────────────────────

function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var params  = e.parameter || {};
    var action  = params.action || '';
    var payload = params.payload ? decodePayload(params.payload) : {};
    var userId  = params.userId  || '';
    var token   = params.token   || '';

    var result;

    if (action === 'setupSheets') {
      // permite correr o setup via URL também
      setupSheets();
      result = { success: true, message: 'Setup concluído.' };
    } else if (action === 'auth') {
      result = handleAuth(payload);
    } else {
      var user = validateSession(userId, token);
      if (!user) {
        result = { error: 'Sessão inválida. Faça login novamente.' };
      } else {
        result = dispatch(action, user, payload);
      }
    }

    output.setContent(JSON.stringify(result));
  } catch (err) {
    output.setContent(JSON.stringify({ error: 'Erro interno: ' + err.toString() }));
  }

  return output;
}

function dispatch(action, user, payload) {
  switch (action) {
    case 'getInit':        return getInit(user);  // batch: stages+ages+parishes+books in 1 call
    case 'getParishes':    return getParishes(user);
    case 'getStages':      return getStages();
    case 'getAgeGroups':   return getAgeGroups();
    case 'getBooks':       return getBooks();
    case 'getUsers':       return getUsers(user);
    case 'getRecords':     return getRecords(user);
    case 'getDashboard':   return getDashboard(user);

    case 'insertParish':   return insertParish(user, payload);
    case 'updateParish':   return updateParish(user, payload);
    case 'deleteParish':   return deleteParish(user, payload);

    case 'insertAgeGroup': return insertAgeGroup(user, payload);
    case 'updateAgeGroup': return updateAgeGroup(user, payload);
    case 'deleteAgeGroup': return deleteAgeGroup(user, payload);

    case 'insertBook':     return insertBook(user, payload);
    case 'updateBook':     return updateBook(user, payload);
    case 'deleteBook':     return deleteBook(user, payload);

    case 'insertUser':     return insertUser(user, payload);
    case 'updateUser':     return updateUser(user, payload);
    case 'deleteUser':     return deleteUser(user, payload);

    case 'insertRecord':   return insertRecord(user, payload);
    case 'updateRecord':   return updateRecord(user, payload);
    case 'deleteRecord':   return deleteRecord(user, payload);
    case 'confirmRecord':  return confirmRecord(user, payload);

    default: return { error: 'Acção desconhecida: ' + action };
  }
}

// ── Cache helpers ─────────────────────────────────────────────────

function cacheGet(key) {
  try {
    var v = CacheService.getScriptCache().get(key);
    return v ? JSON.parse(v) : null;
  } catch(e) { return null; }
}

function cachePut(key, val, ttl) {
  try {
    var s = JSON.stringify(val);
    if (s.length < 95000) CacheService.getScriptCache().put(key, s, ttl || 600);
  } catch(e) {}
}

function cacheRemove(key) {
  try { CacheService.getScriptCache().remove(key); } catch(e) {}
}

function cacheRemoveAll(keys) {
  try { CacheService.getScriptCache().removeAll(keys); } catch(e) {}
}

// ── Utilities ────────────────────────────────────────────────────

function getSheet(name) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" não encontrada. Corre setupSheets() primeiro.');
  return sheet;
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = (row[i] === '' || row[i] === null || row[i] === undefined) ? null : row[i]; });
    return obj;
  });
}

function hashPassword(password) {
  var bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password + 'catequese-vigararia-2024'
  );
  return bytes.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function genId() { return Utilities.getUuid(); }
function now()   { return new Date().toISOString(); }

function decodePayload(b64) {
  try {
    var bytes = Utilities.base64Decode(b64);
    var blob  = Utilities.newBlob(bytes, 'application/octet-stream');
    var chars = blob.getBytes().map(function(b) {
      return String.fromCharCode(b < 0 ? b + 256 : b);
    }).join('');
    return JSON.parse(decodeURIComponent(chars));
  } catch (e) {
    Logger.log('decodePayload error: ' + e);
    return {};
  }
}

function updateRowFields(sheet, id, fields) {
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol   = headers.indexOf('id');
  var colMap  = {};
  headers.forEach(function(h, i) { colMap[h] = i + 1; });

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      var row = i + 1;
      Object.keys(fields).forEach(function(key) {
        if (colMap[key] !== undefined) sheet.getRange(row, colMap[key]).setValue(fields[key] !== null ? fields[key] : '');
      });
      return { success: true };
    }
  }
  return { error: 'Registo não encontrado: ' + id };
}

function deleteById(sheet, id) {
  var data  = sheet.getDataRange().getValues();
  var idCol = data[0].indexOf('id');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Registo não encontrado.' };
}

function adminOnly(user) {
  if (!user || user.role !== 'admin') return { error: 'Sem permissão.' };
  return null;
}

// ── Auth ─────────────────────────────────────────────────────────

function handleAuth(payload) {
  var username = payload.username || '';
  var password = payload.password || '';
  if (!username || !password) return { error: 'Credenciais em falta.' };

  var sheet = getSheet('user_profiles');
  var users = sheetToObjects(sheet);
  var hash  = hashPassword(password);

  var user = users.filter(function(u) {
    return u.username === username && u.password_hash === hash && u.status === 'active';
  })[0];

  if (!user) return { error: 'Username ou senha incorrectos.' };

  var token = genId();
  updateRowFields(sheet, user.id, { session_token: token });

  return {
    success:     true,
    userId:      user.id,
    token:       token,
    username:    user.username,
    displayName: user.display_name || user.username,
    role:        user.role,
    parishId:    user.parish_id || null
  };
}

function validateSession(userId, token) {
  if (!userId || !token) return null;
  // Cache session for 10 min — avoids reading user_profiles sheet on every request
  var cKey = 'sess_' + token;
  var cached = cacheGet(cKey);
  if (cached && String(cached.id) === String(userId)) return cached;

  var users = sheetToObjects(getSheet('user_profiles'));
  var user  = users.filter(function(u) {
    return String(u.id) === String(userId) && u.session_token === token && u.status === 'active';
  })[0];

  if (!user) return null;
  var safe = { id: user.id, username: user.username, display_name: user.display_name, role: user.role, parish_id: user.parish_id, status: user.status };
  cachePut(cKey, safe, 600);
  return safe;
}

// ── Parishes ─────────────────────────────────────────────────────

function getParishes(user) {
  var cKey = 'ref_parishes';
  var all  = cacheGet(cKey);
  if (!all) {
    all = sheetToObjects(getSheet('parishes'));
    cachePut(cKey, all, 300); // 5 min
  }
  var data = user.role === 'admin' ? all : all.filter(function(p) { return p.status === 'active'; });
  return { data: data };
}

function insertParish(user, p) {
  var e = adminOnly(user); if (e) return e;
  var id = genId();
  getSheet('parishes').appendRow([id, p.parish_name, p.city||'', p.coordinator_name||'', p.coordinator_phone||'', p.coordinator_email||'', 'active', now()]);
  cacheRemove('ref_parishes');
  return { success: true, id: id };
}

function updateParish(user, p) {
  var e = adminOnly(user); if (e) return e;
  var r = updateRowFields(getSheet('parishes'), p.id, {
    parish_name: p.parish_name, city: p.city||'', coordinator_name: p.coordinator_name||'',
    coordinator_phone: p.coordinator_phone||'', coordinator_email: p.coordinator_email||'', status: p.status
  });
  if (r.success) cacheRemove('ref_parishes');
  return r;
}

function deleteParish(user, p) {
  var e = adminOnly(user); if (e) return e;
  var r = deleteById(getSheet('parishes'), p.id);
  if (r.success) cacheRemove('ref_parishes');
  return r;
}

// ── Stages ────────────────────────────────────────────────────────

function getStages() {
  var cKey = 'ref_stages';
  var data = cacheGet(cKey);
  if (!data) {
    data = sheetToObjects(getSheet('catechesis_stages'));
    data.sort(function(a,b){ return (Number(a.sort_order)||0)-(Number(b.sort_order)||0); });
    cachePut(cKey, data, 1800); // 30 min — stages rarely change
  }
  return { data: data };
}

// ── Age Groups ────────────────────────────────────────────────────

function getAgeGroups() {
  var cKey = 'ref_ageGroups';
  var data = cacheGet(cKey);
  if (!data) {
    data = sheetToObjects(getSheet('age_groups'));
    cachePut(cKey, data, 1800);
  }
  return { data: data };
}

function insertAgeGroup(user, p) {
  var e = adminOnly(user); if (e) return e;
  var id = genId();
  getSheet('age_groups').appendRow([id, p.age_group, p.description||'']);
  cacheRemove('ref_ageGroups');
  return { success: true, id: id };
}

function updateAgeGroup(user, p) {
  var e = adminOnly(user); if (e) return e;
  var r = updateRowFields(getSheet('age_groups'), p.id, { age_group: p.age_group, description: p.description||'' });
  if (r.success) cacheRemove('ref_ageGroups');
  return r;
}

function deleteAgeGroup(user, p) {
  var e = adminOnly(user); if (e) return e;
  var r = deleteById(getSheet('age_groups'), p.id);
  if (r.success) cacheRemove('ref_ageGroups');
  return r;
}

// ── Books ─────────────────────────────────────────────────────────

function getBooks() {
  var cKey = 'ref_books';
  var data = cacheGet(cKey);
  if (!data) {
    data = sheetToObjects(getSheet('books'));
    cachePut(cKey, data, 600); // 10 min
  }
  return { data: data };
}

function insertBook(user, p) {
  var e = adminOnly(user); if (e) return e;
  var id = genId();
  getSheet('books').appendRow([id, p.book_name, p.author||'', p.publisher||'', p.recommended_stage||'', p.recommended_age||'', p.year||'', now()]);
  cacheRemove('ref_books');
  return { success: true, id: id };
}

function updateBook(user, p) {
  var e = adminOnly(user); if (e) return e;
  var r = updateRowFields(getSheet('books'), p.id, {
    book_name: p.book_name, author: p.author||'', publisher: p.publisher||'',
    recommended_stage: p.recommended_stage||'', recommended_age: p.recommended_age||'', year: p.year||''
  });
  if (r.success) cacheRemove('ref_books');
  return r;
}

function deleteBook(user, p) {
  var e = adminOnly(user); if (e) return e;
  var r = deleteById(getSheet('books'), p.id);
  if (r.success) cacheRemove('ref_books');
  return r;
}

// ── Init batch ────────────────────────────────────────────────────
// Returns all reference data in a single HTTP round-trip

function getInit(user) {
  return {
    stages:    getStages().data,
    ageGroups: getAgeGroups().data,
    parishes:  getParishes(user).data,
    books:     getBooks().data,
  };
}

// ── Users ─────────────────────────────────────────────────────────

function getUsers(user) {
  var e = adminOnly(user); if (e) return e;
  return {
    data: sheetToObjects(getSheet('user_profiles')).map(function(u) {
      return { id: u.id, username: u.username, display_name: u.display_name, role: u.role, parish_id: u.parish_id, status: u.status, created_at: u.created_at };
    })
  };
}

function insertUser(user, p) {
  var e = adminOnly(user); if (e) return e;
  var sheet = getSheet('user_profiles');
  if (sheetToObjects(sheet).some(function(u) { return u.username === p.username; })) return { error: 'Username já existe.' };
  var id = genId();
  sheet.appendRow([id, p.username, p.display_name||p.username, p.role, p.parish_id||'', 'active', hashPassword(p.password), '', now()]);
  return { success: true, id: id };
}

function updateUser(user, p) {
  var e = adminOnly(user); if (e) return e;
  var fields = { display_name: p.display_name||'', role: p.role, parish_id: p.parish_id||'', status: p.status };
  if (p.password) fields.password_hash = hashPassword(p.password);
  return updateRowFields(getSheet('user_profiles'), p.id, fields);
}

function deleteUser(user, p) {
  var e = adminOnly(user); if (e) return e;
  if (String(p.id) === String(user.id)) return { error: 'Não pode eliminar o seu próprio utilizador.' };
  return deleteById(getSheet('user_profiles'), p.id);
}

// ── Records ───────────────────────────────────────────────────────

function getRecords(user) {
  var all = sheetToObjects(getSheet('catechesis_records'));
  if (user.role === 'admin') return { data: all };
  return { data: all.filter(function(r) { return String(r.parish_id) === String(user.parish_id); }) };
}

function insertRecord(user, p) {
  var parishId = user.role === 'admin' ? (p.parish_id || user.parish_id) : user.parish_id;
  if (!parishId) return { error: 'Paróquia não associada.' };

  var dup = sheetToObjects(getSheet('catechesis_records')).filter(function(r) {
    return String(r.parish_id) === String(parishId) &&
        String(r.stage_id)  === String(p.stage_id) &&
        String(r.age_id)    === String(p.age_id) &&
        String(r.book_name||'').toLowerCase().trim() === String(p.book_name||'').toLowerCase().trim();
  })[0];
  if (dup) return { error: 'Registo duplicado: esta combinação já existe.' };

  var id = genId(); var ts = now();
  getSheet('catechesis_records').appendRow([id, parishId, p.stage_id||'', p.age_id||'', p.book_name||'', p.author||'', p.publisher||'', p.year||'', p.notes||'', 'submitted', user.id, ts, ts]);
  return { success: true, id: id };
}

function updateRecord(user, p) {
  var sheet = getSheet('catechesis_records');
  var data  = sheet.getDataRange().getValues();
  var hdrs  = data[0];
  var idCol = hdrs.indexOf('id');
  var pCol  = hdrs.indexOf('parish_id');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(p.id)) {
      if (user.role !== 'admin' && String(data[i][pCol]) !== String(user.parish_id)) return { error: 'Sem permissão.' };
      var fields = { stage_id: p.stage_id, age_id: p.age_id, book_name: p.book_name, author: p.author||'', publisher: p.publisher||'', year: p.year||'', notes: p.notes||'', updated_at: now() };
      if (p.status && user.role === 'admin') fields.status = p.status;
      return updateRowFields(sheet, p.id, fields);
    }
  }
  return { error: 'Registo não encontrado.' };
}

function confirmRecord(user, p) {
  var e = adminOnly(user); if (e) return e;
  return updateRowFields(getSheet('catechesis_records'), p.id, { status: 'confirmed', updated_at: now() });
}

function deleteRecord(user, p) {
  var sheet = getSheet('catechesis_records');
  var data  = sheet.getDataRange().getValues();
  var hdrs  = data[0];
  var idCol = hdrs.indexOf('id');
  var pCol  = hdrs.indexOf('parish_id');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(p.id)) {
      if (user.role !== 'admin' && String(data[i][pCol]) !== String(user.parish_id)) return { error: 'Sem permissão.' };
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Registo não encontrado.' };
}

// ── Dashboard ─────────────────────────────────────────────────────

function getDashboard(user) {
  var e = adminOnly(user); if (e) return e;

  var records  = sheetToObjects(getSheet('catechesis_records'));
  var parishes = sheetToObjects(getSheet('parishes'));
  var stages   = sheetToObjects(getSheet('catechesis_stages'));

  var activeParishes = {}, bookSet = {}, stageSet = {};
  records.forEach(function(r) {
    if (r.parish_id) activeParishes[r.parish_id] = true;
    if (r.book_name) bookSet[String(r.book_name).toLowerCase().trim()] = true;
    if (r.stage_id)  stageSet[r.stage_id] = true;
  });

  var bookMap = {};
  records.forEach(function(r) {
    var key = String(r.book_name||'').trim(); if (!key) return;
    if (!bookMap[key]) bookMap[key] = { count:0, parishSet:{} };
    bookMap[key].count++;
    bookMap[key].parishSet[r.parish_id] = true;
  });
  var topBooks = Object.keys(bookMap).map(function(n) {
    return { name:n, count:bookMap[n].count, parishes:Object.keys(bookMap[n].parishSet).length };
  }).sort(function(a,b){ return b.count-a.count; }).slice(0,8);

  var byParishMap = {};
  records.forEach(function(r) {
    var p = parishes.filter(function(x){ return x.id===r.parish_id; })[0];
    var name = p ? p.parish_name : 'Desconhecida';
    byParishMap[name] = (byParishMap[name]||0)+1;
  });

  var byStageMap = {};
  records.forEach(function(r) {
    var s = stages.filter(function(x){ return x.id===r.stage_id; })[0];
    var name = s ? s.stage_name : 'Desconhecida';
    byStageMap[name] = (byStageMap[name]||0)+1;
  });

  var stageBooks = {};
  records.forEach(function(r) {
    if (!r.stage_id) return;
    if (!stageBooks[r.stage_id]) stageBooks[r.stage_id] = {};
    stageBooks[r.stage_id][String(r.book_name||'').toLowerCase().trim()] = true;
  });
  var stageCount    = Object.keys(stageBooks).length;
  var uniformStages = Object.keys(stageBooks).filter(function(k){ return Object.keys(stageBooks[k]).length===1; }).length;

  var divergences = stages.map(function(stage) {
    var recs = records.filter(function(r){ return r.stage_id===stage.id; });
    var bMap = {};
    recs.forEach(function(r) {
      var key = String(r.book_name||'').trim(); if (!key) return;
      if (!bMap[key]) bMap[key] = [];
      var p = parishes.filter(function(x){ return x.id===r.parish_id; })[0];
      bMap[key].push(p ? p.parish_name : 'Desconhecida');
    });
    var books = Object.keys(bMap).map(function(k){ return { name:k, parishes:bMap[k] }; });
    return { stageId:stage.id, stageName:stage.stage_name, bookCount:books.length, books:books };
  }).filter(function(d){ return d.bookCount>0; });

  return {
    kpis: {
      totalRecords:   records.length,
      activeParishes: Object.keys(activeParishes).length,
      distinctBooks:  Object.keys(bookSet).length,
      stagesCovered:  Object.keys(stageSet).length,
      uniformRate:    stageCount>0 ? Math.round((uniformStages/stageCount)*100) : 0
    },
    topBooks:    topBooks,
    byParish:    Object.keys(byParishMap).map(function(n){ return {name:n, count:byParishMap[n]}; }),
    byStage:     Object.keys(byStageMap).map(function(n){ return {name:n, count:byStageMap[n]}; }),
    divergences: divergences
  };
}

// ── Setup (corre uma vez) ─────────────────────────────────────────

function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var schemas = {
    parishes:           ['id','parish_name','city','coordinator_name','coordinator_phone','coordinator_email','status','created_at'],
    catechesis_stages:  ['id','stage_name','category','sort_order'],
    age_groups:         ['id','age_group','description'],
    books:              ['id','book_name','author','publisher','recommended_stage','recommended_age','year','created_at'],
    user_profiles:      ['id','username','display_name','role','parish_id','status','password_hash','session_token','created_at'],
    catechesis_records: ['id','parish_id','stage_id','age_id','book_name','author','publisher','year','notes','status','created_by','created_at','updated_at']
  };

  Object.keys(schemas).forEach(function(name) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sheet.getLastRow() === 0) sheet.appendRow(schemas[name]);
  });

  seedInitialData(ss);
  Logger.log('✓ Setup concluído!');
}

function seedInitialData(ss) {
  var stages = ss.getSheetByName('catechesis_stages');
  if (stages.getLastRow() <= 1) {
    [[genId(),'Pré-Catecumenato','Catecumenato',1],[genId(),'1º Catecumenato','Catecumenato',2],
      [genId(),'2º Catecumenato','Catecumenato',3],[genId(),'3º Catecumenato','Catecumenato',4],
      [genId(),'1º Crisma','Crisma',5],[genId(),'2º Crisma','Crisma',6],[genId(),'Intensivo','Especial',7]]
        .forEach(function(r){ stages.appendRow(r); });
  }
  var ages = ss.getSheetByName('age_groups');
  if (ages.getLastRow() <= 1) {
    [[genId(),'Crianças','7–12 anos'],[genId(),'Adolescentes','13–17 anos'],
      [genId(),'Jovens','18–25 anos'],[genId(),'Adultos','26+ anos']]
        .forEach(function(r){ ages.appendRow(r); });
  }
  var users = ss.getSheetByName('user_profiles');
  if (users.getLastRow() <= 1) {
    users.appendRow([genId(),'admin','Administrador','admin','','active',hashPassword('admin123'),'',now()]);
    Logger.log('✓ Admin criado: username=admin | senha=admin123');
  }
}