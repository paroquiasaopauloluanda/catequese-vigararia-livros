import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../api/sheets';
import type { Stage, AgeGroup, Parish, Book } from '../types';

interface InitData {
  stages:    Stage[];
  ageGroups: AgeGroup[];
  parishes:  Parish[];
  books:     Book[];
}

export function useReferenceData() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['init'],
    queryFn:  async () => {
      const result = await callApi('getInit') as InitData;
      // Populate individual query caches so per-key useQuery calls hit cache
      qc.setQueryData(['stages'],    { data: result.stages });
      qc.setQueryData(['ageGroups'], { data: result.ageGroups });
      qc.setQueryData(['parishes'],  { data: result.parishes });
      qc.setQueryData(['books'],     { data: result.books });
      return result;
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    stages:    data?.stages    ?? [],
    ageGroups: data?.ageGroups ?? [],
    parishes:  data?.parishes  ?? [],
    books:     data?.books     ?? [],
    isLoadingRef: isLoading,
  };
}
