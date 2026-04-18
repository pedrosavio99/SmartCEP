import axios from 'axios';

class BrasilAPIProvider {
  async buscarCEP(cep) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
        timeout: 5000 // 5 segundos de timeout
      });

      const latency = Date.now() - startTime;

      if (response.data && !response.data.erro) {
        return {
          success: true,
          data: {
            cep: response.data.cep,
            logradouro: response.data.street || response.data.logradouro,
            complemento: response.data.complement || '',
            bairro: response.data.neighborhood || response.data.bairro,
            localidade: response.data.city || response.data.localidade,
            uf: response.data.state || response.data.uf,
            ibge: response.data.ibge || '',
            ddd: response.data.ddd || ''
          },
          provider: 'BrasilAPI',
          latency
        };
      }

      return { success: false, error: 'CEP não encontrado' };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: error.message || 'Erro na BrasilAPI',
        provider: 'BrasilAPI',
        latency
      };
    }
  }
}

export default new BrasilAPIProvider();