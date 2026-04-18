import pool from '../config/database.js';

class AddressService {
  async criar(cep, apelido, dadosEndereco = {}) {
    const result = await pool.query(`
      INSERT INTO addresses 
      (cep, apelido, logradouro, complemento, bairro, localidade, uf)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      cep,
      apelido,
      dadosEndereco.logradouro || '',
      dadosEndereco.complemento || '',
      dadosEndereco.bairro || '',
      dadosEndereco.localidade || '',
      dadosEndereco.uf || ''
    ]);
    return result.rows[0];
  }

  async listar() {
    const result = await pool.query(`
      SELECT * FROM addresses 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async atualizar(id, apelido) {
    const result = await pool.query(`
      UPDATE addresses 
      SET apelido = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `, [apelido, id]);
    return result.rows[0];
  }

  async deletar(id) {
    await pool.query('DELETE FROM addresses WHERE id = $1', [id]);
    return { success: true };
  }
}

export default new AddressService();