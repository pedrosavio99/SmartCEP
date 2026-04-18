import axios from 'axios';

class ViaCEPProvider {
  async buscarCEP(cep) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`, {
        timeout: 5000
      });

      const latency = Date.now() - startTime;

      if (response.data && !response.data.erro) {
        return {
          success: true,
          data: {
            cep: response.data.cep,
            logradouro: response.data.logradouro,
            complemento: response.data.complemento || '',
            bairro: response.data.bairro,
            localidade: response.data.localidade,
            uf: response.data.uf,
            ibge: response.data.ibge || '',
            ddd: response.data.ddd || ''
          },
          provider: 'ViaCEP',
          latency
        };
      }

      return { success: false, error: 'CEP não encontrado' };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: error.message || 'Erro no ViaCEP',
        provider: 'ViaCEP',
        latency
      };
    }
  }
}

export default new ViaCEPProvider();