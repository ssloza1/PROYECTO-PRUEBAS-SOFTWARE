/**
 * Mock reutilizable para pruebas unitarias de servicios y repositorios
 */
function createMockDb() {
  const queryMock = jest.fn();
  const clientMock = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn(),
  };

  return {
    query: queryMock,
    getClient: jest.fn().mockResolvedValue(clientMock),
    closePool: jest.fn().mockResolvedValue(true),
    clientMock,
  };
}

module.exports = {
  createMockDb,
};
