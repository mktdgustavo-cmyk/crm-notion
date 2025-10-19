import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, TrendingUp, Clock, DollarSign, Users, AlertCircle, RefreshCw, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CRMDashboard = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [error, setError] = useState(null);

  const getStageFromStatus = (status) => {
    const todoStatuses = ['Novo Lead', 'Tentativa de contato', 'Lead Interessado', 'Contato Realizado'];
    const completeStatuses = ['Contrato enviado', 'Iniciar Implementação', 'PERDA', 'ARQUIVO'];
    
    if (todoStatuses.includes(status)) return 'to_do';
    if (completeStatuses.includes(status)) return 'complete';
    return 'in_progress';
  };

  const fetchNotionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/deals`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      const processedDeals = result.data.map(deal => ({
        ...deal,
        stage: getStageFromStatus(deal.status)
      }));

      setDeals(processedDeals);
      console.log('Dados carregados:', processedDeals);
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotionData();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(fetchNotionData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const wonDeals = deals.filter(d => d.status === 'Iniciar Implementação' || d.status === 'Contrato enviado');
  const lostDeals = deals.filter(d => d.status === 'PERDA');
  
  const metrics = {
    total: deals.length,
    won: wonDeals.length,
    lost: lostDeals.length,
    active: deals.filter(d => d.stage === 'in_progress').length,
    totalValue: deals.reduce((sum, d) => sum + d.value, 0),
    wonValue: wonDeals.reduce((sum, d) => sum + d.value, 0)
  };

  const conversionRate = (metrics.won + metrics.lost) > 0 
    ? ((metrics.won / (metrics.won + metrics.lost)) * 100).toFixed(1) 
    : 0;

  const stuckDeals = deals.filter(d => {
    const daysSinceUpdate = Math.floor((new Date() - new Date(d.lastUpdate)) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate > 30 && d.stage === 'in_progress';
  });

  const closedDeals = wonDeals;
  const avgClosingTime = closedDeals.length > 0 
    ? Math.floor(closedDeals.reduce((sum, d) => {
        const days = Math.floor((new Date(d.lastUpdate) - new Date(d.createdAt)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / closedDeals.length)
    : 0;

  const funnelData = [
    { name: 'To-Do', value: deals.filter(d => d.stage === 'to_do').length, fill: '#6B7280' },
    { name: 'Em Progresso', value: deals.filter(d => d.stage === 'in_progress').length, fill: '#3B82F6' },
    { name: 'Ganhos', value: metrics.won, fill: '#10B981' },
    { name: 'Perdidos', value: metrics.lost, fill: '#EF4444' }
  ];

  const valueByStage = [
    { name: 'To-Do', value: deals.filter(d => d.stage === 'to_do').reduce((sum, d) => sum + d.value, 0) },
    { name: 'Em Progresso', value: deals.filter(d => d.stage === 'in_progress').reduce((sum, d) => sum + d.value, 0) },
    { name: 'Ganhos', value: metrics.wonValue }
  ];

  const filteredDeals = deals.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = filterStage === 'all' || d.stage === filterStage;
    return matchSearch && matchStage;
  });

  const dealsByStage = {
    to_do: filteredDeals.filter(d => d.stage === 'to_do'),
    in_progress: filteredDeals.filter(d => d.stage === 'in_progress'),
    complete: filteredDeals.filter(d => d.stage === 'complete')
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-500';
    if (status.includes('PERDA')) return 'bg-red-500';
    if (status.includes('Contrato') || status.includes('Iniciar')) return 'bg-green-500';
    if (status.includes('Congelado')) return 'bg-blue-400';
    if (status.includes('Follow')) return 'bg-yellow-500';
    return 'bg-purple-500';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold mb-2">Erro ao conectar com Notion</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={fetchNotionData} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'min-h-screen bg-gray-900 text-white' : 'min-h-screen bg-gray-50 text-gray-900'}>
      <div className={darkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-lg'}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                CRM Dashboard
              </h1>
              <p className={darkMode ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
                ✅ Conectado ao Notion • {deals.length} oportunidades
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchNotionData} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                {loading ? <Loader className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className={darkMode ? 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600' : 'px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300'}>
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && deals.length === 0 ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
            <p className="text-gray-400">Carregando dados do Notion...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={darkMode ? 'bg-gray-800 p-6 rounded-xl shadow-lg' : 'bg-white p-6 rounded-xl shadow-lg'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={darkMode ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>Total</p>
                  <p className="text-3xl font-bold mt-2">{metrics.total}</p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </div>

            <div className={darkMode ? 'bg-gray-800 p-6 rounded-xl shadow-lg' : 'bg-white p-6 rounded-xl shadow-lg'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={darkMode ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>Conversão</p>
                  <p className="text-3xl font-bold mt-2 text-green-500">{conversionRate}%</p>
                </div>
                <TrendingUp className="text-green-500" size={32} />
              </div>
            </div>

            <div className={darkMode ? 'bg-gray-800 p-6 rounded-xl shadow-lg' : 'bg-white p-6 rounded-xl shadow-lg'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={darkMode ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>Tempo Médio</p>
                  <p className="text-3xl font-bold mt-2">{avgClosingTime}d</p>
                </div>
                <Clock className="text-yellow-500" size={32} />
              </div>
            </div>

            <div className={darkMode ? 'bg-gray-800 p-6 rounded-xl shadow-lg' : 'bg-white p-6 rounded-xl shadow-lg'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={darkMode ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>Valor Ganho</p>
                  <p className="text-2xl font-bold mt-2 text-green-500">R$ {metrics.wonValue.toLocaleString('pt-BR')}</p>
                </div>
                <DollarSign className="text-green-500" size={32} />
              </div>
            </div>
          </div>

          {stuckDeals.length > 0 && (
            <div className="bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-600 p-4 mb-8 rounded-r-lg">
              <div className="flex items-center">
                <AlertCircle className="text-yellow-500 mr-3" size={24} />
                <div>
                  <p className="font-semibold">⚠️ {stuckDeals.length} oportunidade(s) parada(s) há mais de 30 dias</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={darkMode ? 'bg-gray-800 p-6 rounded-xl shadow-lg' : 'bg-white p-6 rounded-xl shadow-lg'}>
              <h3 className="text-xl font-bold mb-4">Funil de Vendas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={funnelData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {funnelData.map((entry, index) => (
                      <Cell key={'cell' + index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={darkMode ? 'bg-gray-800 p-6 rounded-xl shadow-lg' : 'bg-white p-6 rounded-xl shadow-lg'}>
              <h3 className="text-xl font-bold mb-4">Valor por Estágio</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={valueByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={darkMode ? 'w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700' : 'w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300'}
              />
            </div>
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className={darkMode ? 'px-4 py-3 rounded-lg bg-gray-800 border border-gray-700' : 'px-4 py-3 rounded-lg bg-white border border-gray-300'}>
              <option value="all">Todos</option>
              <option value="to_do">To-Do</option>
              <option value="in_progress">Em Progresso</option>
              <option value="complete">Completo</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={darkMode ? 'bg-gray-800 rounded-xl shadow-lg p-4' : 'bg-white rounded-xl shadow-lg p-4'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">To-Do</h3>
                <span className="px-3 py-1 rounded-full text-sm bg-gray-700">{dealsByStage.to_do.length}</span>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {dealsByStage.to_do.map(deal => (
                  <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-650 border-l-4 border-gray-500">
                    <h4 className="font-semibold mb-2">{deal.title}</h4>
                    <div className={'inline-block px-2 py-1 rounded text-xs text-white mb-2 ' + getStatusColor(deal.status)}>
                      {deal.status}
                    </div>
                    {deal.value > 0 && <p className="text-sm text-green-500 font-semibold">R$ {deal.value.toLocaleString('pt-BR')}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className={darkMode ? 'bg-gray-800 rounded-xl shadow-lg p-4' : 'bg-white rounded-xl shadow-lg p-4'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Em Progresso</h3>
                <span className="px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-500">{dealsByStage.in_progress.length}</span>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {dealsByStage.in_progress.map(deal => (
                  <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-650 border-l-4 border-blue-500">
                    <h4 className="font-semibold mb-2">{deal.title}</h4>
                    <div className={'inline-block px-2 py-1 rounded text-xs text-white mb-2 ' + getStatusColor(deal.status)}>
                      {deal.status}
                    </div>
                    {deal.value > 0 && <p className="text-sm text-green-500 font-semibold">R$ {deal.value.toLocaleString('pt-BR')}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className={darkMode ? 'bg-gray-800 rounded-xl shadow-lg p-4' : 'bg-white rounded-xl shadow-lg p-4'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Completo</h3>
                <span className="px-3 py-1 rounded-full text-sm bg-green-900 text-green-500">{dealsByStage.complete.length}</span>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {dealsByStage.complete.map(deal => (
                  <div key={deal.id} onClick={() => setSelectedDeal(deal)} className={'bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-650 border-l-4 ' + (deal.status === 'PERDA' ? 'border-red-500' : 'border-green-500')}>
                    <h4 className="font-semibold mb-2">{deal.title}</h4>
                    <div className={'inline-block px-2 py-1 rounded text-xs text-white mb-2 ' + getStatusColor(deal.status)}>
                      {deal.status}
                    </div>
                    {deal.value > 0 && <p className="text-sm text-green-500 font-semibold">R$ {deal.value.toLocaleString('pt-BR')}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDeal(null)}>
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">{selectedDeal.title}</h2>
              <button onClick={() => setSelectedDeal(null)} className="hover:bg-gray-700 p-2 rounded-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <div className={'inline-block px-3 py-1 rounded text-sm text-white mt-1 ' + getStatusColor(selectedDeal.status)}>
                  {selectedDeal.status}
                </div>
              </div>
              {selectedDeal.value > 0 && (
                <div>
                  <label className="text-sm text-gray-400">Valor</label>
                  <p className="text-2xl font-bold text-green-500">R$ {selectedDeal.value.toLocaleString('pt-BR')}</p>
                </div>
              )}
              {selectedDeal.gk && (
                <div>
                  <label className="text-sm text-gray-400">GK</label>
                  <p>{selectedDeal.gk}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDashboard;
