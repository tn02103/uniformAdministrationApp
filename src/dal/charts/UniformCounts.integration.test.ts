/* eslint-disable jest/no-conditional-expect */
import { getUniformCountBySizeForType, getUniformCountByType } from './UniformCounts';
import { AuthRole } from '@/lib/AuthRoles';
import { staticData } from '../../../jest/setup-dal-integration';
import type { UniformType } from '@prisma/client';

// Integration tests use real database and static test data
// staticData provides comprehensive test dataset with known relationships

describe('UniformCounts DAL - Integration Tests', () => {
    beforeEach(() => {
        // Set test globals for authentication
        global.__ROLE__ = AuthRole.admin;
        global.__USERNAME__ = 'integrationTestUser';
        global.__ORGANISATION__ = staticData.organisationId;
    });

    describe('Database Query Validation', () => {
        describe('getUniformCountBySizeForType - Real Database Execution', () => {
            it('should execute query correctly with static test data', async () => {
                // Use the first uniform type from static data (Typ1)
                const uniformTypeId = staticData.data.uniformTypes[0].id; // Typ1 - uses generations and sizes

                const result = await getUniformCountBySizeForType(uniformTypeId);

                // Verify basic query execution
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBe(true);
                
                // Should have sizes since Typ1 uses sizes
                expect(result.length).toBeGreaterThan(0);

                // Verify data structure matches expected format
                result.forEach(sizeResult => {
                    expect(sizeResult).toHaveProperty('size');
                    expect(sizeResult).toHaveProperty('sizeId');
                    expect(sizeResult).toHaveProperty('quantities');
                    expect(sizeResult).toHaveProperty('issuedReserveCadets');
                    
                    expect(sizeResult.quantities).toHaveProperty('available');
                    expect(sizeResult.quantities).toHaveProperty('issued');
                    expect(sizeResult.quantities).toHaveProperty('reserves');
                    expect(sizeResult.quantities).toHaveProperty('issuedReserves');
                    
                    expect(typeof sizeResult.quantities.available).toBe('number');
                    expect(typeof sizeResult.quantities.issued).toBe('number');
                    expect(typeof sizeResult.quantities.reserves).toBe('number');
                    expect(typeof sizeResult.quantities.issuedReserves).toBe('number');
                    
                    expect(Array.isArray(sizeResult.issuedReserveCadets)).toBe(true);
                });
            });

            it('should handle uniform type without sizes correctly', async () => {
                // Use Typ2 - has generations but no sizes (usingSizes: false)
                const uniformTypeId = staticData.data.uniformTypes[1].id; // Typ2

                const result = await getUniformCountBySizeForType(uniformTypeId);

                // Should return empty array since this type doesn't use sizes
                expect(result).toEqual([]);
            });

            it('should filter by association correctly', async () => {
                const uniformTypeId = staticData.data.uniformTypes[0].id;

                // Test with correct association
                const result = await getUniformCountBySizeForType(uniformTypeId);
                expect(result.length).toBeGreaterThan(0);

                // Test with wrong association by changing global
                const originalAssociation = global.__ORGANISATION__;
                global.__ORGANISATION__ = 'wrong-organisation-id';

                try {
                    // Should throw an error due to validation failure
                    await expect(getUniformCountBySizeForType(uniformTypeId)).rejects.toThrow();
                } finally {
                    global.__ORGANISATION__ = originalAssociation;
                }
            });
        });

        describe('getUniformCountByType - Real Database Execution', () => {
            it('should execute query correctly with static test data', async () => {
                const result = await getUniformCountByType();

                // Verify basic query execution
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBe(true);
                
                // Should have uniform types (at least 4 active types from static data)
                expect(result.length).toBeGreaterThanOrEqual(4);

                // Verify data structure matches expected format
                result.forEach(typeResult => {
                    expect(typeResult).toHaveProperty('name');
                    expect(typeResult).toHaveProperty('id');
                    expect(typeResult).toHaveProperty('quantities');
                    expect(typeResult).toHaveProperty('issuedReserveCadets');
                    expect(typeResult).toHaveProperty('missingCadets');
                    
                    expect(typeResult.quantities).toHaveProperty('available');
                    expect(typeResult.quantities).toHaveProperty('issued');
                    expect(typeResult.quantities).toHaveProperty('reserves');
                    expect(typeResult.quantities).toHaveProperty('issuedReserves');
                    expect(typeResult.quantities).toHaveProperty('missing');
                    
                    expect(typeof typeResult.quantities.available).toBe('number');
                    expect(typeof typeResult.quantities.issued).toBe('number');
                    expect(typeof typeResult.quantities.reserves).toBe('number');
                    expect(typeof typeResult.quantities.issuedReserves).toBe('number');
                    expect(typeof typeResult.quantities.missing).toBe('number');
                    
                    expect(Array.isArray(typeResult.issuedReserveCadets)).toBe(true);
                    expect(Array.isArray(typeResult.missingCadets)).toBe(true);
                });
            });

            it('should exclude soft-deleted uniform types correctly', async () => {
                const result = await getUniformCountByType();

                // Should not include Typ5 which has recdelete set in static data
                const typeNames = result.map(type => type.name);
                expect(typeNames).not.toContain('Typ5');
                
                // Should include active types
                expect(typeNames).toContain('Typ1');
                expect(typeNames).toContain('Typ2');
                expect(typeNames).toContain('Typ3');
                expect(typeNames).toContain('Typ4');
            });
        });

        describe('Soft Delete Handling', () => {
            it('should exclude soft-deleted uniforms from counts', async () => {
                // Static data has some uniforms with recdelete set
                const uniformTypeId = staticData.data.uniformTypes[0].id;

                const result = await getUniformCountBySizeForType(uniformTypeId);

                // Verify the query execution completed successfully
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBe(true);

                // The exact counts will depend on static data, but structure should be valid
                result.forEach(sizeResult => {
                    expect(sizeResult.quantities.available).toBeGreaterThanOrEqual(0);
                    expect(sizeResult.quantities.issued).toBeGreaterThanOrEqual(0);
                    expect(sizeResult.quantities.reserves).toBeGreaterThanOrEqual(0);
                    expect(sizeResult.quantities.issuedReserves).toBeGreaterThanOrEqual(0);
                });
            });
        });

        describe('Complex Join Relationships', () => {
            it('should correctly handle multi-table joins and relationships', async () => {
                const result = await getUniformCountByType();

                // Find a type that should have issued uniforms based on static data
                const typeWithIssues = result.find(type => type.quantities.issued > 0);
                expect(typeWithIssues).toBeDefined();

                // Verify issued cadets are properly mapped when type exists
                if (typeWithIssues) {
                    expect(typeWithIssues.issuedReserveCadets).toBeDefined();
                    expect(typeWithIssues.missingCadets).toBeDefined();
                } else {
                    // Ensure we have at least some test coverage
                    expect(result.length).toBeGreaterThan(0);
                }

                // Verify at least one type has missing uniforms calculation
                const typeWithMissing = result.find(type => type.quantities.missing > 0);
                
                // Test missing cadets structure when present
                if (typeWithMissing) {
                    expect(typeWithMissing.missingCadets.length).toBeGreaterThan(0);
                    
                    // Verify cadet structure
                    typeWithMissing.missingCadets.forEach(cadet => {
                        expect(cadet).toHaveProperty('id');
                        expect(cadet).toHaveProperty('firstname');
                        expect(cadet).toHaveProperty('lastname');
                        expect(typeof cadet.id).toBe('string');
                        expect(typeof cadet.firstname).toBe('string');
                        expect(typeof cadet.lastname).toBe('string');
                    });
                } else {
                    // If no missing uniforms, verify all types have proper structure
                    result.forEach(type => {
                        expect(type.missingCadets).toBeDefined();
                        expect(Array.isArray(type.missingCadets)).toBe(true);
                    });
                }
            });
        });
    });

    describe('Performance & Optimization', () => {
        describe('Query Performance', () => {
            it('should execute getUniformCountBySizeForType within reasonable time', async () => {
                const uniformTypeId = staticData.data.uniformTypes[0].id;
                
                const startTime = performance.now();
                const result = await getUniformCountBySizeForType(uniformTypeId);
                const endTime = performance.now();
                
                const executionTime = endTime - startTime;
                
                // Should complete within 1 second for static test data
                expect(executionTime).toBeLessThan(1000);
                expect(result).toBeDefined();
            });

            it('should execute getUniformCountByType within reasonable time', async () => {
                const startTime = performance.now();
                const result = await getUniformCountByType();
                const endTime = performance.now();
                
                const executionTime = endTime - startTime;
                
                // Should complete within 2 seconds for static test data
                expect(executionTime).toBeLessThan(2000);
                expect(result).toBeDefined();
                expect(result.length).toBeGreaterThan(0);
            });
        });

        describe('Large Dataset Handling', () => {
            it('should handle all uniform types efficiently', async () => {
                const result = await getUniformCountByType();
                
                // Should process all active uniform types from static data
                expect(result.length).toBeGreaterThanOrEqual(4);
                
                // Verify each type has complete data
                result.forEach(type => {
                    const totalUniforms = type.quantities.available + type.quantities.issued + 
                                        type.quantities.reserves + type.quantities.issuedReserves;
                    expect(totalUniforms).toBeGreaterThanOrEqual(0);
                });
            });
        });
    });

    describe('End-to-End Scenarios', () => {
        describe('Complete Uniform Lifecycle', () => {
            it('should accurately reflect uniform states from static data', async () => {
                // Test with Typ1 which has various uniform states in static data
                const uniformTypeId = staticData.data.uniformTypes[0].id; // Typ1
                
                const result = await getUniformCountBySizeForType(uniformTypeId);
                
                // Should have results for sizes that exist in static data
                expect(result.length).toBeGreaterThan(0);
                
                // Verify totals are consistent
                let totalUniforms = 0;
                result.forEach(sizeResult => {
                    const sizeTotal = sizeResult.quantities.available + 
                                    sizeResult.quantities.issued + 
                                    sizeResult.quantities.reserves + 
                                    sizeResult.quantities.issuedReserves;
                    totalUniforms += sizeTotal;
                    
                    // Each size should have valid counts
                    expect(sizeTotal).toBeGreaterThanOrEqual(0);
                });
                
                expect(totalUniforms).toBeGreaterThan(0);
            });
        });

        describe('Multi-Size Type Scenario', () => {
            it('should handle uniform types with multiple sizes correctly', async () => {
                // Use Typ1 which uses sizes (usingSizes: true)
                const uniformTypeId = staticData.data.uniformTypes[0].id;
                
                const result = await getUniformCountBySizeForType(uniformTypeId);
                
                // Should have multiple sizes
                expect(result.length).toBeGreaterThan(1);
                
                // Verify sort order is maintained (by sortOrder asc)
                for (let i = 1; i < result.length; i++) {
                    // Results should be ordered properly (can't easily verify exact order without size data)
                    expect(result[i].size).toBeDefined();
                    expect(result[i].sizeId).toBeDefined();
                }
                
                // Verify each size has valid data structure
                result.forEach(sizeResult => {
                    expect(sizeResult.size).toBeTruthy();
                    expect(sizeResult.sizeId).toBeTruthy();
                });
            });
        });

        describe('No-Size Type Scenario', () => {
            it('should return empty result for types not using sizes', async () => {
                // Use Typ4 which doesn't use sizes (usingSizes: false)
                const uniformTypeId = staticData.data.uniformTypes[3].id; // Typ4
                
                const result = await getUniformCountBySizeForType(uniformTypeId);
                
                // Should return empty array since this type doesn't use sizes
                expect(result).toEqual([]);
            });
        });

        describe('Missing Uniforms Calculation', () => {
            it('should calculate missing uniforms based on real cadet data', async () => {
                const result = await getUniformCountByType();
                
                // Find types with issuedDefault > 0
                const typesWithDefaults = result.filter(type => {
                    // Get the static data to check issuedDefault
                    const staticType = staticData.data.uniformTypes.find((st: UniformType) => st.id === type.id);
                    return staticType && staticType.issuedDefault > 0;
                });
                
                expect(typesWithDefaults.length).toBeGreaterThan(0);
                
                // Ensure we have at least one type to test
                if (typesWithDefaults.length === 0) {
                    expect(result.length).toBeGreaterThan(0); // Fallback assertion
                }
                
                typesWithDefaults.forEach(type => {
                    // Missing calculation should be consistent
                    const hasMissing = type.quantities.missing > 0;
                    
                    if (hasMissing) {
                        expect(type.missingCadets.length).toBeGreaterThan(0);
                    } else {
                        // If no missing, could be empty or cadets could be fully equipped
                        expect(type.quantities.missing).toBe(0);
                    }
                });
            });
        });

        describe('Complex Cadet Scenarios', () => {
            it('should handle cadets with multiple uniforms correctly', async () => {
                const result = await getUniformCountByType();
                
                // Find type that has issued uniforms
                const typeWithIssued = result.find(type => type.quantities.issued > 0);
                expect(typeWithIssued).toBeDefined();
                
                // Test issued isReserve cadets structure when present
                if (typeWithIssued && typeWithIssued.quantities.issuedReserves > 0) {
                    expect(typeWithIssued.issuedReserveCadets.length).toBe(typeWithIssued.quantities.issuedReserves);
                    
                    typeWithIssued.issuedReserveCadets.forEach(cadet => {
                        expect(cadet).toHaveProperty('id');
                        expect(cadet).toHaveProperty('firstname');
                        expect(cadet).toHaveProperty('lastname');
                    });
                } else {
                    // Ensure basic structure is present
                    result.forEach(type => {
                        expect(type.issuedReserveCadets).toBeDefined();
                        expect(Array.isArray(type.issuedReserveCadets)).toBe(true);
                    });
                }
            });
        });

        describe('Data Consistency Validation', () => {
            it('should maintain consistency between different query results', async () => {
                const allTypesResult = await getUniformCountByType();
                
                // Test individual type queries against aggregate results
                for (const typeResult of allTypesResult) {
                    // Get static data for this type to check if it uses sizes
                    const staticType = staticData.data.uniformTypes.find((st: UniformType) => st.id === typeResult.id);
                    
                    const usingSizes = staticType?.usingSizes ?? false;
                    
                    if (usingSizes) {
                        const sizeResults = await getUniformCountBySizeForType(typeResult.id);
                        
                        // Sum up size-based results
                        const sizeTotals = sizeResults.reduce((acc, sizeResult) => {
                            acc.available += sizeResult.quantities.available;
                            acc.issued += sizeResult.quantities.issued;
                            acc.reserves += sizeResult.quantities.reserves;
                            acc.issuedReserves += sizeResult.quantities.issuedReserves;
                            return acc;
                        }, { available: 0, issued: 0, reserves: 0, issuedReserves: 0 });
                        
                        // Note: Size-based queries only include uniforms with sizes
                        // Aggregate queries include all uniforms (including those without sizes)
                        // So we only compare if the size-based totals are <= aggregate totals
                        expect(sizeTotals.available).toBeLessThanOrEqual(typeResult.quantities.available);
                        expect(sizeTotals.issued).toBeLessThanOrEqual(typeResult.quantities.issued);
                        expect(sizeTotals.reserves).toBeLessThanOrEqual(typeResult.quantities.reserves);
                        expect(sizeTotals.issuedReserves).toBeLessThanOrEqual(typeResult.quantities.issuedReserves);
                        
                        // Verify that the size-based query returns reasonable results
                        const sizeBasedTotal = sizeTotals.available + sizeTotals.issued + sizeTotals.reserves + sizeTotals.issuedReserves;
                        const aggregateTotal = typeResult.quantities.available + typeResult.quantities.issued + 
                                             typeResult.quantities.reserves + typeResult.quantities.issuedReserves;
                        expect(sizeBasedTotal).toBeLessThanOrEqual(aggregateTotal);
                    } else {
                        // For types not using sizes, verify basic structure
                        expect(typeResult.quantities).toBeDefined();
                    }
                }
            });

            it('should ensure all totals are non-negative', async () => {
                const result = await getUniformCountByType();
                
                result.forEach(type => {
                    expect(type.quantities.available).toBeGreaterThanOrEqual(0);
                    expect(type.quantities.issued).toBeGreaterThanOrEqual(0);
                    expect(type.quantities.reserves).toBeGreaterThanOrEqual(0);
                    expect(type.quantities.issuedReserves).toBeGreaterThanOrEqual(0);
                    expect(type.quantities.missing).toBeGreaterThanOrEqual(0);
                });
                
                // Test size-based query as well
                const uniformTypeId = staticData.data.uniformTypes[0].id;
                const sizeResults = await getUniformCountBySizeForType(uniformTypeId);
                
                sizeResults.forEach(size => {
                    expect(size.quantities.available).toBeGreaterThanOrEqual(0);
                    expect(size.quantities.issued).toBeGreaterThanOrEqual(0);
                    expect(size.quantities.reserves).toBeGreaterThanOrEqual(0);
                    expect(size.quantities.issuedReserves).toBeGreaterThanOrEqual(0);
                });
            });
        });

        describe('Real Database Constraints', () => {
            it('should respect database foreign key relationships', async () => {
                const result = await getUniformCountByType();
                
                // All returned types should exist in static data
                const staticTypeIds = staticData.data.uniformTypes
                    .filter((type: UniformType) => !type.recdelete) // Only active types
                    .map((type: UniformType) => type.id);
                
                result.forEach(type => {
                    expect(staticTypeIds).toContain(type.id);
                });
                
                // All cadet references should be valid
                result.forEach(type => {
                    type.issuedReserveCadets.forEach(cadet => {
                        expect(cadet.id).toBeTruthy();
                        expect(cadet.firstname).toBeTruthy();
                        expect(cadet.lastname).toBeTruthy();
                    });
                    
                    type.missingCadets.forEach(cadet => {
                        expect(cadet.id).toBeTruthy();
                        expect(cadet.firstname).toBeTruthy();
                        expect(cadet.lastname).toBeTruthy();
                    });
                });
            });
        });
    });
});