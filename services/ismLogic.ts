import { SSIMValue, BinaryMatrix, LevelPartition, ISMResult } from '../types';

/**
 * Converts the SSIM dictionary to an Initial Reachability Matrix (IRM).
 * Returns an N x N binary matrix.
 */
export const convertSSIMToIRM = (
  size: number,
  ids: string[],
  ssim: Record<string, Record<string, SSIMValue>>
): BinaryMatrix => {
  // Initialize matrix with 0s
  const matrix: BinaryMatrix = Array.from({ length: size }, () => Array(size).fill(0));

  for (let i = 0; i < size; i++) {
    matrix[i][i] = 1; // Self-reachability is always 1 in ISM
    for (let j = i + 1; j < size; j++) {
      const idI = ids[i];
      const idJ = ids[j];
      
      // Look up relation. Safe access with default to 'O'.
      const val = ssim[idI]?.[idJ] || SSIMValue.O;

      // Logic rules for ISM based on Upper Triangle input
      // V: i -> j
      // A: j -> i
      // X: i <-> j
      // O: No relation
      
      if (val === SSIMValue.V) {
        matrix[i][j] = 1;
        matrix[j][i] = 0;
      } else if (val === SSIMValue.A) {
        matrix[i][j] = 0;
        matrix[j][i] = 1;
      } else if (val === SSIMValue.X) {
        matrix[i][j] = 1;
        matrix[j][i] = 1;
      } else { // O or default
        matrix[i][j] = 0;
        matrix[j][i] = 0;
      }
    }
  }
  return matrix;
};

/**
 * Checks for transitivity using Warshall's Algorithm.
 * If A->B and B->C, then A->C.
 */
export const computeFinalReachabilityMatrix = (irm: BinaryMatrix): BinaryMatrix => {
  const size = irm.length;
  // Deep copy
  const matrix = irm.map((row) => [...row]);

  for (let k = 0; k < size; k++) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // If i reaches k and k reaches j, then i reaches j
        if (matrix[i][k] === 1 && matrix[k][j] === 1) {
          matrix[i][j] = 1;
        }
      }
    }
  }
  return matrix;
};

/**
 * Performs Level Partitioning on the Final Reachability Matrix.
 */
export const performLevelPartitioning = (frm: BinaryMatrix): LevelPartition[] => {
  const size = frm.length;
  let remainingElements = new Set<number>(Array.from({ length: size }, (_, i) => i));
  const levels: LevelPartition[] = [];
  let currentLevel = 1;
  const MAX_LEVELS = size + 5; // Safety cap

  while (remainingElements.size > 0) {
    const currentLevelElements: number[] = [];

    // Check each remaining element
    remainingElements.forEach((i) => {
      // Reachability Set R(i)
      const reachable: number[] = [];
      // Antecedent Set A(i)
      const antecedent: number[] = [];

      // Only consider elements that are still remaining
      remainingElements.forEach((j) => {
        if (frm[i][j] === 1) reachable.push(j);
        if (frm[j][i] === 1) antecedent.push(j);
      });

      // Intersection R(i) ∩ A(i)
      // Since reachable contains only elements in remaining set, 
      // and antecedent contains only elements in remaining set,
      // we check if R(i) is a subset of A(i).
      // Since x is always in R(x) and A(x), the intersection is never empty.
      
      const intersection = reachable.filter((x) => antecedent.includes(x));

      // Condition: R(i) == R(i) ∩ A(i)
      if (reachable.length === intersection.length) {
        currentLevelElements.push(i);
      }
    });

    if (currentLevelElements.length === 0) {
      // Logic fallback: If no elements found (cycle cluster remaining), output all remaining as one level
      // This happens in strong components.
      remainingElements.forEach(el => currentLevelElements.push(el));
      levels.push({ level: currentLevel, elements: currentLevelElements });
      break; 
    }

    levels.push({ level: currentLevel, elements: currentLevelElements });
    
    // Remove found elements from remaining set
    currentLevelElements.forEach((el) => remainingElements.delete(el));
    currentLevel++;
    
    if (currentLevel > MAX_LEVELS) break;
  }

  return levels;
};

/**
 * Calculates the Canonical Matrix (Transitive Reduction) for cleaner graphing.
 */
export const getCanonicalMatrix = (frm: BinaryMatrix): BinaryMatrix => {
    const size = frm.length;
    const skeleton = frm.map(row => [...row]);

    // Remove self-loops for drawing
    for(let i=0; i<size; i++) skeleton[i][i] = 0;

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (skeleton[i][j] === 1) {
                // Check if there is an intermediate path i -> k -> j
                for (let k = 0; k < size; k++) {
                    if (k !== i && k !== j && frm[i][k] === 1 && frm[k][j] === 1) {
                        skeleton[i][j] = 0; // Remove direct link if indirect exists
                        break; 
                    }
                }
            }
        }
    }
    return skeleton;
}

export const runISMAnalysis = (
  size: number,
  ids: string[],
  ssim: Record<string, Record<string, SSIMValue>>
): ISMResult => {
  // Ensure we have correct inputs
  if (!ids || ids.length !== size) {
      console.error("ISM Logic Error: IDs mismatch size");
  }

  const irm = convertSSIMToIRM(size, ids, ssim);
  const frm = computeFinalReachabilityMatrix(irm);
  const levels = performLevelPartitioning(frm);
  const canonicalMatrix = getCanonicalMatrix(frm);

  return {
    initialReachabilityMatrix: irm,
    finalReachabilityMatrix: frm,
    canonicalMatrix,
    levels,
  };
};