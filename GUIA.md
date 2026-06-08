# Catequese Vigararia — Guia de Instalação

## Pré-requisitos
- Node.js 18+
- Conta Google (para Google Sheets + Apps Script)
- Conta Netlify (deploy gratuito)

---

## 1. Configurar Google Sheets

1. Acesse [sheets.new](https://sheets.new) e crie uma Spreadsheet
2. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/**SEU_ID_AQUI**/edit`

---

## 2. Configurar Google Apps Script

1. Na Spreadsheet, vá a **Extensões → Apps Script**
2. Apague o código existente
3. Cole o conteúdo de `google-apps-script.js`
4. Defina o ID da Spreadsheet em **Configurações do Projecto → Propriedades do Script**:
   - Chave: `SPREADSHEET_ID`
   - Valor: O ID copiado no passo 1
5. Clique em **Executar → setupSheets** para criar as sheets e o utilizador admin
6. Autorize o script quando pedido
7. Vá a **Implementar → Nova Implementação**:
   - Tipo: **Aplicação Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
8. Copie o URL da aplicação web (ex: `https://script.google.com/macros/s/XXX/exec`)

> **Credenciais iniciais:** username=`admin` | senha=`admin123` — altere após o primeiro login!

---

## 3. Configurar o Frontend

```bash
# Instalar dependências
npm install

# Criar ficheiro .env
cp .env.example .env
```

Edite `.env` e cole o URL do Apps Script:
```
VITE_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
```

---

## 4. Desenvolvimento Local

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173)

---

## 5. Deploy no Netlify

### Via CLI:
```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

### Via GitHub (recomendado):
1. Push o projecto para GitHub
2. Em [netlify.com](https://netlify.com), ligue ao repositório
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Em **Environment Variables**, adicione: `VITE_SCRIPT_URL=...`

---

## Estrutura de Ficheiros

```
src/
├── api/sheets.ts          # Cliente HTTP → Apps Script
├── context/
│   ├── AuthContext.tsx    # Autenticação + sessão
│   └── ToastContext.tsx   # Notificações
├── components/            # Componentes reutilizáveis
├── pages/                 # Páginas da aplicação
├── styles/theme.ts        # Sistema de design (cores, espaçamento)
├── types/index.ts         # TypeScript interfaces
└── utils/export.ts        # Excel + CSV export
```

---

## Segurança

- Senhas hasheadas com SHA-256 + salt no Apps Script
- Session token único por login, armazenado na Spreadsheet
- Coordenadores só acedem aos dados da sua própria paróquia
- Sem exposição de senhas ou tokens no frontend além da chave pública

---

## Utilizadores padrão após setup

| Username | Senha    | Perfil |
|----------|----------|--------|
| admin    | admin123 | Admin  |

**Altere a senha imediatamente após o primeiro login!**