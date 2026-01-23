import React, { useMemo } from 'react';
import { ISMElement, ISMResult } from '../types';

interface Props {
  factors: ISMElement[];
  result: ISMResult;
}

const AnalysisTable: React.FC<Props> = ({ factors, result }) => {
  const tableData = useMemo(() => {
    const { finalReachabilityMatrix, levels } = result;
    const size = factors.length;
    
    // Map factor index to its level
    const levelMap = new Map<number, number>();
    levels.forEach(l => {
        l.elements.forEach(idx => levelMap.set(idx, l.level));
    });

    const rows = factors.map((factor, i) => {
        const reachabilitySet: number[] = [];
        const antecedentSet: number[] = [];
        
        // Calculate sets based on Final Reachability Matrix
        for (let j = 0; j < size; j++) {
            if (finalReachabilityMatrix[i][j] === 1) {
                reachabilitySet.push(j);
            }
            if (finalReachabilityMatrix[j][i] === 1) {
                antecedentSet.push(j);
            }
        }

        // Intersection
        const intersection = reachabilitySet.filter(x => antecedentSet.includes(x));

        return {
            id: i,
            name: factor.name,
            reachability: reachabilitySet.map(idx => factors[idx].name).join('; '),
            antecedent: antecedentSet.map(idx => factors[idx].name).join('; '),
            intersection: intersection.map(idx => factors[idx].name).join('; '),
            level: levelMap.get(i)
        };
    });

    // Sort by Level Ascending
    return rows.sort((a, b) => {
        const levelA = a.level ?? Number.MAX_VALUE;
        const levelB = b.level ?? Number.MAX_VALUE;
        if (levelA !== levelB) {
            return levelA - levelB;
        }
        // Secondary sort by Name for consistent ordering within levels
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [factors, result]);

  return (
    <div className="overflow-x-auto border rounded-lg border-slate-200">
      <table className="w-full border-collapse text-sm text-left">
        <thead className="bg-slate-50 text-slate-700 font-semibold">
          <tr>
            <th className="p-3 border border-slate-200 w-20">Factor</th>
            <th className="p-3 border border-slate-200">Reachability Set</th>
            <th className="p-3 border border-slate-200">Antecedent Set</th>
            <th className="p-3 border border-slate-200">Intersection</th>
            <th className="p-3 border border-slate-200 w-16 text-center">Level</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {tableData.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              <td className="p-3 border border-slate-200 font-semibold text-slate-900">{row.name}</td>
              <td className="p-3 border border-slate-200 text-slate-600 break-words max-w-xs">{row.reachability}</td>
              <td className="p-3 border border-slate-200 text-slate-600 break-words max-w-xs">{row.antecedent}</td>
              <td className="p-3 border border-slate-200 text-slate-600 break-words max-w-xs">{row.intersection}</td>
              <td className="p-3 border border-slate-200 text-center font-bold text-indigo-600">{row.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalysisTable;