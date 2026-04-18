import pool from '../config/database.js';
import brasilProvider from '../providers/brasilapi.provider.js';
import viaProvider from '../providers/viacep.provider.js';
import dotenv from 'dotenv';

dotenv.config();

class CepService {
  async buscar(cep) {
    // Normaliza CEP (remove tudo que não for número)
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      throw new Error('CEP inválido. Deve ter 8 dígitos.');
    }

    const startTotal = Date.now();

    // 1. Verifica cache
    try {
      const cacheResult = await pool.query(
        'SELECT * FROM cep_cache WHERE cep = $1',
        [cepLimpo]
      );

      if (cacheResult.rows.length > 0) {
        console.log(`📦 [CACHE HIT] CEP ${cepLimpo}`);
        return {
          ...cacheResult.rows[0],
          source: 'cache',
          latency: 0
        };
      }
    } catch (err) {
      console.error('Erro ao consultar cache:', err.message);
    }

    // 2. Tenta BrasilAPI (primária)
    let resultado;
    const forceFail = process.env.FORCE_PRIMARY_FAIL === 'true';

    if (!forceFail) {
      resultado = await brasilProvider.buscarCEP(cepLimpo);
      if (resultado.success) {
        await this.salvarNoCache(cepLimpo, resultado.data);
        const totalLatency = Date.now() - startTotal;
        console.log(`✅ [BrasilAPI] Sucesso em ${totalLatency}ms`);
        return { ...resultado.data, source: 'BrasilAPI', latency: totalLatency };
      }
      console.log(`⚠️ [BrasilAPI] Falhou: ${resultado.error}`);
    }

    // 3. Fallback para ViaCEP
    resultado = await viaProvider.buscarCEP(cepLimpo);
    if (resultado.success) {
      await this.salvarNoCache(cepLimpo, resultado.data);
      const totalLatency = Date.now() - startTotal;
      console.log(`✅ [ViaCEP - FALLBACK] Sucesso em ${totalLatency}ms`);
      return { ...resultado.data, source: 'ViaCEP (fallback)', latency: totalLatency };
    }

    throw new Error(`CEP não encontrado em nenhuma API: ${resultado.error}`);
  }

  async salvarNoCache(cep, data) {
    try {
      await pool.query(`
        INSERT INTO cep_cache 
        (cep, logradouro, complemento, bairro, localidade, uf, ibge, ddd, cached_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        ON CONFLICT (cep) DO NOTHING
      `, [
        cep,
        data.logradouro || '',
        data.complemento || '',
        data.bairro || '',
        data.localidade || '',
        data.uf || '',
        data.ibge || '',
        data.ddd || ''
      ]);
    } catch (err) {
      console.error('Erro ao salvar cache:', err.message);
    }
  }
}

export default new CepService();