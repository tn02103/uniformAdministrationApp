import { AuthRole } from '@/lib/AuthRoles';
import { getUniformCountBySizeForType, getUniformCountByType } from './UniformCounts';

// Mock setup is handled by jest/setup-dal-unit.ts
const mockPrisma = jest.requireMock('@/lib/db').prisma;

describe('UniformCounts DAL - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Set default test globals
        global.__ROLE__ = AuthRole.admin;
        global.__USERNAME__ = 'testuser';
        global.__ASSOSIATION__ = 'test-assosiation-id';
    });

    describe('getUniformCountBySizeForType', () => {
        const mockUniformTypeId = 'uniform-type-123';

        describe('Empty and Edge Cases', () => {
            it('should handle empty size list', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                mockPrisma.uniformSize.findMany.mockResolvedValue([]);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                expect(result).toEqual([]);
                expect(mockPrisma.uniformSize.findMany).toHaveBeenCalledWith({
                    where: {
                        uniformList: {
                            some: {
                                fk_uniformType: mockUniformTypeId,
                                recdelete: null
                            }
                        }
                    },
                    select: {
                        id: true,
                        name: true,
                        uniformList: {
                            where: {
                                fk_uniformType: mockUniformTypeId,
                                recdelete: null
                            },
                            select: {
                                id: true,
                                isReserve: true,
                                issuedEntries: {
                                    where: {
                                        dateReturned: null
                                    },
                                    select: {
                                        id: true,
                                        cadet: {
                                            select: {
                                                id: true,
                                                firstname: true,
                                                lastname: true
                                            }
                                        }
                                    }
                                },
                                generation: {
                                    select: {
                                        isReserve: true,
                                    }
                                },
                            }
                        }
                    },
                    orderBy: {
                        sortOrder: 'asc'
                    }
                });
            });

            it('should handle size with no uniforms', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                const mockSizes = [{
                    id: 'size-1',
                    name: 'Small',
                    uniformList: []
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual({
                    size: 'Small',
                    sizeId: 'size-1',
                    quantities: {
                        available: 0,
                        issued: 0,
                        reserves: 0,
                        issuedReserves: 0,
                    },
                    issuedReserveCadets: []
                });
            });
        });

        describe('Available Uniforms Calculation', () => {
            it('should correctly count available uniforms (not reserve with no issues)', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                const mockSizes = [{
                    id: 'size-1',
                    name: 'Medium',
                    uniformList: [
                        { id: 'uniform-1', isReserve: false, issuedEntries: [] },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [] },
                        { id: 'uniform-3', isReserve: true, issuedEntries: [] }, // Should not count
                        { id: 'uniform-4', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] } // Should not count
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                expect(result[0].quantities.available).toBe(2);
            });
        });

        describe('Issued Uniforms Calculation', () => {
            it('should correctly count issued uniforms (not reserve with issues)', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                const mockSizes = [{
                    id: 'size-1',
                    name: 'Large',
                    uniformList: [
                        { id: 'uniform-1', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' } }] },
                        { id: 'uniform-3', isReserve: false, issuedEntries: [] }, // Should not count
                        { id: 'uniform-4', isReserve: true, issuedEntries: [{ id: 'issue-3', cadet: { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' } }] } // Should not count
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                expect(result[0].quantities.issued).toBe(2);
            });
        });

        describe('Reserve Uniforms Calculation', () => {
            it('should correctly count reserve uniforms (reserve with no issues)', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                const mockSizes = [{
                    id: 'size-1',
                    name: 'XL',
                    uniformList: [
                        { id: 'uniform-1', isReserve: true, issuedEntries: [] },
                        { id: 'uniform-2', isReserve: true, issuedEntries: [] },
                        { id: 'uniform-3', isReserve: true, issuedEntries: [] },
                        { id: 'uniform-4', isReserve: false, issuedEntries: [] }, // Should not count
                        { id: 'uniform-5', isReserve: true, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] } // Should not count
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                expect(result[0].quantities.reserves).toBe(3);
            });
        });

        describe('Issued Reserves Calculation', () => {
            it('should correctly count issued reserves and map cadets (reserve with issues)', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                const mockSizes = [{
                    id: 'size-1',
                    name: 'XXL',
                    uniformList: [
                        { 
                            id: 'uniform-1', 
                            isReserve: true, 
                            issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'Alice', lastname: 'Johnson' } }] 
                        },
                        { 
                            id: 'uniform-2', 
                            isReserve: true, 
                            issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-2', firstname: 'Bob', lastname: 'Williams' } }] 
                        },
                        { id: 'uniform-3', isReserve: true, issuedEntries: [] }, // Should not count
                        { 
                            id: 'uniform-4', 
                            isReserve: false, 
                            issuedEntries: [{ id: 'issue-3', cadet: { id: 'cadet-3', firstname: 'Carol', lastname: 'Brown' } }] 
                        } // Should not count
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                expect(result[0].quantities.issuedReserves).toBe(2);
                expect(result[0].issuedReserveCadets).toHaveLength(2);
                expect(result[0].issuedReserveCadets).toEqual([
                    { id: 'cadet-1', firstname: 'Alice', lastname: 'Johnson' },
                    { id: 'cadet-2', firstname: 'Bob', lastname: 'Williams' }
                ]);
            });
        });

        describe('Mixed Scenario Calculation', () => {
            it('should correctly handle complex scenario with all uniform states', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                const mockSizes = [{
                    id: 'size-1',
                    name: 'Mixed',
                    uniformList: [
                        // Available: not isReserve + no issues
                        { id: 'uniform-1', isReserve: false, issuedEntries: [] },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [] },
                        
                        // Issued: not isReserve + has issues  
                        { id: 'uniform-3', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        { id: 'uniform-4', isReserve: false, issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' } }] },
                        { id: 'uniform-5', isReserve: false, issuedEntries: [{ id: 'issue-3', cadet: { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' } }] },
                        
                        // Reserves: isReserve + no issues
                        { id: 'uniform-6', isReserve: true, issuedEntries: [] },
                        { id: 'uniform-7', isReserve: true, issuedEntries: [] },
                        { id: 'uniform-8', isReserve: true, issuedEntries: [] },
                        { id: 'uniform-9', isReserve: true, issuedEntries: [] },
                        
                        // Issued reserves: isReserve + has issues
                        { id: 'uniform-10', isReserve: true, issuedEntries: [{ id: 'issue-4', cadet: { id: 'cadet-4', firstname: 'Alice', lastname: 'Brown' } }] },
                        { id: 'uniform-11', isReserve: true, issuedEntries: [{ id: 'issue-5', cadet: { id: 'cadet-5', firstname: 'Charlie', lastname: 'Davis' } }] }
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                expect(result[0]).toEqual({
                    size: 'Mixed',
                    sizeId: 'size-1',
                    quantities: {
                        available: 2,
                        issued: 3,
                        reserves: 4,
                        issuedReserves: 2,
                    },
                    issuedReserveCadets: [
                        { id: 'cadet-4', firstname: 'Alice', lastname: 'Brown' },
                        { id: 'cadet-5', firstname: 'Charlie', lastname: 'Davis' }
                    ]
                });
            });
        });

        describe('Sort Order and Data Structure', () => {
            it('should preserve sort order and maintain proper data structure', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                const mockSizes = [
                    {
                        id: 'size-3',
                        name: 'Large',
                        uniformList: [
                            { id: 'uniform-1', isReserve: false, issuedEntries: [] }
                        ]
                    },
                    {
                        id: 'size-1',
                        name: 'Small', 
                        uniformList: [
                            { id: 'uniform-2', isReserve: false, issuedEntries: [] }
                        ]
                    },
                    {
                        id: 'size-2',
                        name: 'Medium',
                        uniformList: [
                            { id: 'uniform-3', isReserve: false, issuedEntries: [] }
                        ]
                    }
                ];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                expect(result).toHaveLength(3);
                expect(mockPrisma.uniformSize.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        orderBy: { sortOrder: 'asc' }
                    })
                );
                
                // Verify each result has the correct structure
                result.forEach(sizeResult => {
                    expect(sizeResult).toHaveProperty('size');
                    expect(sizeResult).toHaveProperty('sizeId');
                    expect(sizeResult).toHaveProperty('quantities');
                    expect(sizeResult).toHaveProperty('issuedReserveCadets');
                    expect(sizeResult.quantities).toHaveProperty('available');
                    expect(sizeResult.quantities).toHaveProperty('issued');
                    expect(sizeResult.quantities).toHaveProperty('reserves');
                    expect(sizeResult.quantities).toHaveProperty('issuedReserves');
                });
            });
        });

        describe('Generation-Based Reserve Logic', () => {
            it('should consider generation.isReserve flag when usingGenerations is true and uniform.is  Reserve is false', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: true
                });
                
                const mockSizes = [{
                    id: 'size-1',
                    name: 'Medium',
                    uniformList: [
                        { id: 'uniform-1', isReserve: false, issuedEntries: [], generation: { isReserve: true } },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [], generation: { isReserve: false } },
                        { id: 'uniform-3', isReserve: true, issuedEntries: [], generation: { isReserve: false } },
                        { id: 'uniform-4', isReserve: true, issuedEntries: [], generation: { isReserve: true } }
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                // uniform-1: isReserve=false but generation.isReserve=true -> should be isReserve
                // uniform-2: isReserve=false and generation.isReserve=false -> should be available
                // uniform-3: isReserve=true -> should be isReserve
                // uniform-4: isReserve=true -> should be isReserve
                expect(result[0].quantities.available).toBe(1); // uniform-2
                expect(result[0].quantities.reserves).toBe(3); // uniform-1, uniform-3, uniform-4
            });

            it('should ignore generation.isReserve flag when usingGenerations is false', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: false
                });
                
                const mockSizes = [{
                    id: 'size-1',
                    name: 'Medium',
                    uniformList: [
                        { id: 'uniform-1', isReserve: false, issuedEntries: [], generation: { isReserve: true } },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [], generation: { isReserve: false } },
                        { id: 'uniform-3', isReserve: true, issuedEntries: [], generation: { isReserve: false } },
                        { id: 'uniform-4', isReserve: true, issuedEntries: [], generation: { isReserve: true } }
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                // Only uniform.isReserve should matter, generation.isReserve should be ignored
                expect(result[0].quantities.available).toBe(2); // uniform-1, uniform-2
                expect(result[0].quantities.reserves).toBe(2); // uniform-3, uniform-4
            });

            it('should handle generation-based reserve with issued uniforms', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: true
                });
                
                const mockSizes = [{
                    id: 'size-1',
                    name: 'Large',
                    uniformList: [
                        { 
                            id: 'uniform-1', 
                            isReserve: false, 
                            issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }], 
                            generation: { isReserve: true } 
                        },
                        { 
                            id: 'uniform-2', 
                            isReserve: false, 
                            issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' } }], 
                            generation: { isReserve: false } 
                        }
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                // uniform-1: isReserve=false but generation.isReserve=true and issued -> should be issuedReserves
                // uniform-2: isReserve=false and generation.isReserve=false and issued -> should be issued
                expect(result[0].quantities.issued).toBe(1); // uniform-2
                expect(result[0].quantities.issuedReserves).toBe(1); // uniform-1
                expect(result[0].issuedReserveCadets).toEqual([
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' }
                ]);
            });

            it('should handle null generation gracefully', async () => {
                mockPrisma.uniformType.findUniqueOrThrow.mockResolvedValue({
                    id: mockUniformTypeId,
                    usingGenerations: true
                });
                
                const mockSizes = [{
                    id: 'size-1',
                    name: 'Medium',
                    uniformList: [
                        { id: 'uniform-1', isReserve: false, issuedEntries: [], generation: null },
                        { id: 'uniform-2', isReserve: true, issuedEntries: [], generation: null }
                    ]
                }];

                mockPrisma.uniformSize.findMany.mockResolvedValue(mockSizes);

                const result = await getUniformCountBySizeForType(mockUniformTypeId);

                // When generation is null, only uniform.isReserve should matter
                expect(result[0].quantities.available).toBe(1); // uniform-1
                expect(result[0].quantities.reserves).toBe(1); // uniform-2
            });
        });
    });

    describe('getUniformCountByType', () => {
        describe('Empty and Edge Cases', () => {
            it('should handle empty type list', async () => {
                mockPrisma.uniformType.findMany.mockResolvedValue([]);
                mockPrisma.cadet.findMany.mockResolvedValue([]);

                const result = await getUniformCountByType();

                expect(result).toEqual([]);
            });

            it('should handle type with no uniforms', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Test Type',
                    issuedDefault: 2,
                    uniformList: []
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual({
                    name: 'Test Type',
                    id: 'type-1',
                    quantities: {
                        available: 0,
                        issued: 0,
                        reserves: 0,
                        issuedReserves: 0,
                        missing: 4, // 2 cadets * 2 issuedDefault each
                    },
                    issuedReserveCadets: [],
                    missingCadets: [
                        { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                        { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                    ]
                });
            });
        });

        describe('Basic Count Calculations', () => {
            it('should correctly count available, issued, and reserve uniforms', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Basic Type',
                    issuedDefault: 1,
                    usingGenerations: false,
                    uniformList: [
                        // Available: not isReserve + no issues
                        { id: 'uniform-1', isReserve: false, issuedEntries: [] },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [] },
                        
                        // Issued: not isReserve + has issues
                        { id: 'uniform-3', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        
                        // Reserves: isReserve + no issues
                        { id: 'uniform-4', isReserve: true, issuedEntries: [] },
                        { id: 'uniform-5', isReserve: true, issuedEntries: [] },
                        { id: 'uniform-6', isReserve: true, issuedEntries: [] },
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                expect(result[0].quantities.available).toBe(2);
                expect(result[0].quantities.issued).toBe(1);
                expect(result[0].quantities.reserves).toBe(3);
                expect(result[0].quantities.issuedReserves).toBe(0);
            });
        });

        describe('Missing Calculation Logic', () => {
            it('should calculate missing uniforms correctly with basic scenario', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Missing Test',
                    issuedDefault: 2,
                    usingGenerations: false,
                    uniformList: [
                        // John has 1 uniform (needs 1 more)
                        { id: 'uniform-1', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        // Jane has 0 uniforms (needs 2 more) - no uniforms issued to her
                        // Bob has 2 uniforms (needs 0 more)
                        { id: 'uniform-2', isReserve: false, issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' } }] },
                        { id: 'uniform-3', isReserve: false, issuedEntries: [{ id: 'issue-3', cadet: { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' } }] },
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' },
                    { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                expect(result[0].quantities.missing).toBe(3); // John needs 1, Jane needs 2, Bob needs 0
                expect(result[0].missingCadets).toHaveLength(2);
                expect(result[0].missingCadets).toEqual([
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ]);
            });

            it('should handle zero issuedDefault correctly', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Zero Default',
                    issuedDefault: 0,
                    usingGenerations: false,
                    uniformList: [
                        { id: 'uniform-1', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] }
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                expect(result[0].quantities.missing).toBe(0);
                expect(result[0].missingCadets).toHaveLength(0);
            });

            it('should handle over-issued scenarios correctly', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Over Issued',
                    issuedDefault: 1,
                    usingGenerations: false,
                    uniformList: [
                        // John has 3 uniforms (more than needed)
                        { id: 'uniform-1', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        { id: 'uniform-3', isReserve: false, issuedEntries: [{ id: 'issue-3', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                expect(result[0].quantities.missing).toBe(1); // Only Jane is missing 1
                expect(result[0].missingCadets).toHaveLength(1);
                expect(result[0].missingCadets).toEqual([
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ]);
            });
        });

        describe('Issued Reserves and Cadet Mapping', () => {
            it('should correctly handle issued reserves and map cadets', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'isReserve Test',
                    issuedDefault: 1,
                    usingGenerations: false,
                    uniformList: [
                        // Regular issued uniform
                        { id: 'uniform-1', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        
                        // Issued reserves
                        { id: 'uniform-2', isReserve: true, issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-2', firstname: 'Alice', lastname: 'Brown' } }] },
                        { id: 'uniform-3', isReserve: true, issuedEntries: [{ id: 'issue-3', cadet: { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' } }] },
                        
                        // Regular isReserve
                        { id: 'uniform-4', isReserve: true, issuedEntries: [] }
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                expect(result[0].quantities.issuedReserves).toBe(2);
                expect(result[0].issuedReserveCadets).toHaveLength(2);
                expect(result[0].issuedReserveCadets).toEqual([
                    { id: 'cadet-2', firstname: 'Alice', lastname: 'Brown' },
                    { id: 'cadet-3', firstname: 'Bob', lastname: 'Wilson' }
                ]);
            });
        });

        describe('Complex Missing Calculation Scenarios', () => {
            it('should handle multiple cadets with varying shortfalls', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Complex Missing',
                    issuedDefault: 3,
                    usingGenerations: false,
                    uniformList: [
                        // Alice has 1 uniform (needs 2 more)
                        { id: 'uniform-1', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'Alice', lastname: 'Brown' } }] },
                        
                        // Bob has 2 uniforms (needs 1 more)
                        { id: 'uniform-2', isReserve: false, issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-2', firstname: 'Bob', lastname: 'Wilson' } }] },
                        { id: 'uniform-3', isReserve: false, issuedEntries: [{ id: 'issue-3', cadet: { id: 'cadet-2', firstname: 'Bob', lastname: 'Wilson' } }] },
                        
                        // Charlie has 3 uniforms (needs 0 more)
                        { id: 'uniform-4', isReserve: false, issuedEntries: [{ id: 'issue-4', cadet: { id: 'cadet-3', firstname: 'Charlie', lastname: 'Davis' } }] },
                        { id: 'uniform-5', isReserve: false, issuedEntries: [{ id: 'issue-5', cadet: { id: 'cadet-3', firstname: 'Charlie', lastname: 'Davis' } }] },
                        { id: 'uniform-6', isReserve: false, issuedEntries: [{ id: 'issue-6', cadet: { id: 'cadet-3', firstname: 'Charlie', lastname: 'Davis' } }] },
                        
                        // Diana has 0 uniforms (needs 3 more) - no uniforms issued
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'Alice', lastname: 'Brown' },
                    { id: 'cadet-2', firstname: 'Bob', lastname: 'Wilson' },
                    { id: 'cadet-3', firstname: 'Charlie', lastname: 'Davis' },
                    { id: 'cadet-4', firstname: 'Diana', lastname: 'Miller' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                expect(result[0].quantities.missing).toBe(6); // Alice needs 2, Bob needs 1, Diana needs 3 = 6 total
                expect(result[0].missingCadets).toHaveLength(3);
                expect(result[0].missingCadets).toEqual([
                    { id: 'cadet-1', firstname: 'Alice', lastname: 'Brown' },
                    { id: 'cadet-2', firstname: 'Bob', lastname: 'Wilson' },
                    { id: 'cadet-4', firstname: 'Diana', lastname: 'Miller' }
                ]);
            });
        });

        describe('Complete Data Integration', () => {
            it('should produce complete and accurate output structure with all fields', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Complete Test',
                    issuedDefault: 2,
                    usingGenerations: false,
                    uniformList: [
                        // Available
                        { id: 'uniform-1', isReserve: false, issuedEntries: [] },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [] },
                        
                        // Issued
                        { id: 'uniform-3', isReserve: false, issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        { id: 'uniform-4', isReserve: false, issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }] },
                        
                        // Reserves
                        { id: 'uniform-5', isReserve: true, issuedEntries: [] },
                        
                        // Issued Reserves
                        { id: 'uniform-6', isReserve: true, issuedEntries: [{ id: 'issue-3', cadet: { id: 'cadet-3', firstname: 'isReserve', lastname: 'User' } }] }
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual({
                    name: 'Complete Test',
                    id: 'type-1',
                    quantities: {
                        available: 2,
                        issued: 2,
                        reserves: 1,
                        issuedReserves: 1,
                        missing: 2, // Jane needs 2
                    },
                    issuedReserveCadets: [
                        { id: 'cadet-3', firstname: 'isReserve', lastname: 'User' }
                    ],
                    missingCadets: [
                        { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                    ]
                });

                // Verify the Prisma query structure
                expect(mockPrisma.uniformType.findMany).toHaveBeenCalledWith({
                    where: {
                        recdelete: null,
                        fk_assosiation: 'test-assosiation-id'
                    },
                    select: {
                        id: true,
                        name: true,
                        issuedDefault: true,
                        usingGenerations: true,
                        uniformList: {
                            where: {
                                recdelete: null
                            },
                            select: {
                                id: true,
                                isReserve: true,
                                issuedEntries: {
                                    where: {
                                        dateReturned: null
                                    },
                                    select: {
                                        id: true,
                                        cadet: {
                                            select: {
                                                id: true,
                                                firstname: true,
                                                lastname: true
                                            }
                                        }
                                    }
                                },
                                generation: {
                                    select: {
                                        isReserve: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        sortOrder: 'asc'
                    }
                });

                expect(mockPrisma.cadet.findMany).toHaveBeenCalledWith({
                    where: {
                        active: true,
                        recdelete: null,
                        fk_assosiation: 'test-assosiation-id'
                    },
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true
                    }
                });
            });
        });

        describe('Generation-Based isReserve Logic', () => {
            it('should consider generation.isReserve flag when usingGenerations is true', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Generation Test',
                    issuedDefault: 1,
                    usingGenerations: true,
                    uniformList: [
                        { id: 'uniform-1', isReserve: false, issuedEntries: [], generation: { isReserve: true } },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [], generation: { isReserve: false } },
                        { id: 'uniform-3', isReserve: true, issuedEntries: [], generation: { isReserve: false } },
                        { 
                            id: 'uniform-4', 
                            isReserve: false, 
                            issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }], 
                            generation: { isReserve: true } 
                        }
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                // uniform-1: isReserve=false but generation.isReserve=true -> should be isReserve
                // uniform-2: isReserve=false and generation.isReserve=false -> should be available
                // uniform-3: isReserve=true -> should be isReserve
                // uniform-4: isReserve=false but generation.isReserve=true and issued -> should be issuedReserves
                expect(result[0].quantities.available).toBe(1); // uniform-2
                expect(result[0].quantities.issued).toBe(0); // none
                expect(result[0].quantities.reserves).toBe(2); // uniform-1, uniform-3
                expect(result[0].quantities.issuedReserves).toBe(1); // uniform-4
                expect(result[0].issuedReserveCadets).toEqual([
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' }
                ]);
            });

            it('should ignore generation.isReserve flag when usingGenerations is false', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'No Generation Test',
                    issuedDefault: 1,
                    usingGenerations: false,
                    uniformList: [
                        { id: 'uniform-1', isReserve: false, issuedEntries: [], generation: { isReserve: true } },
                        { id: 'uniform-2', isReserve: false, issuedEntries: [], generation: { isReserve: false } },
                        { id: 'uniform-3', isReserve: true, issuedEntries: [], generation: { isReserve: false } },
                        { 
                            id: 'uniform-4', 
                            isReserve: false, 
                            issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }], 
                            generation: { isReserve: true } 
                        }
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                // Only uniform.isReserve should matter, generation.isReserve should be ignored
                expect(result[0].quantities.available).toBe(2); // uniform-1, uniform-2
                expect(result[0].quantities.issued).toBe(1); // uniform-4
                expect(result[0].quantities.reserves).toBe(1); // uniform-3
                expect(result[0].quantities.issuedReserves).toBe(0); // none
            });

            it('should handle generation-based reserves in missing calculations', async () => {
                const mockTypes = [{
                    id: 'type-1',
                    name: 'Generation Missing Test',
                    issuedDefault: 2,
                    usingGenerations: true,
                    uniformList: [
                        // John has one regular issued uniform
                        { 
                            id: 'uniform-1', 
                            isReserve: false, 
                            issuedEntries: [{ id: 'issue-1', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }], 
                            generation: { isReserve: false } 
                        },
                        // John has one generation-based isReserve issued (shouldn't count toward regular issued)
                        { 
                            id: 'uniform-2', 
                            isReserve: false, 
                            issuedEntries: [{ id: 'issue-2', cadet: { id: 'cadet-1', firstname: 'John', lastname: 'Doe' } }], 
                            generation: { isReserve: true } 
                        }
                    ]
                }];

                const mockCadets = [
                    { id: 'cadet-1', firstname: 'John', lastname: 'Doe' },
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ];

                mockPrisma.uniformType.findMany.mockResolvedValue(mockTypes);
                mockPrisma.cadet.findMany.mockResolvedValue(mockCadets);

                const result = await getUniformCountByType();

                // John should have 0 more needed (has 1 regular + 1 isReserve = 2 total, meets issuedDefault of 2)
                // Jane should need 2 (has 0)
                expect(result[0].quantities.missing).toBe(2);
                expect(result[0].missingCadets).toEqual([
                    { id: 'cadet-2', firstname: 'Jane', lastname: 'Smith' }
                ]);
                expect(result[0].quantities.issued).toBe(1); // uniform-1
                expect(result[0].quantities.issuedReserves).toBe(1); // uniform-2
            });
        });
    });
});