import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function MusicProfitabilityPredictor() {
  const [formData, setFormData] = useState({
    songTitle: '',
    investment: 50000,
    genre: 'Phonk',
    dailySpotifyStreams: 10000,
    mainMarkets: ['US', 'DE', 'GB'],
    upsideLevel: 'stable'
  });

  const [predictions, setPredictions] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Country-specific Spotify revenue per stream rates (DKK) - Spotify only!
  const spotifyCountryRates = {
    'AR': 0.004, 'AT': 0.022, 'AU': 0.019, 'BE': 0.020, 'BR': 0.007,
    'CA': 0.017, 'CL': 0.005, 'DE': 0.021, 'DK': 0.027, 'ES': 0.010,
    'FI': 0.026, 'FR': 0.016, 'GB': 0.029, 'IT': 0.012, 'MX': 0.007,
    'NL': 0.024, 'NO': 0.027, 'PT': 0.010, 'SE': 0.025, 'UY': 0.007, 'US': 0.025
  };

  // Country name mapping
  const countryNames = {
    'AR': 'Argentina', 'AT': 'Austria', 'AU': 'Australia', 'BE': 'Belgium', 'BR': 'Brazil',
    'CA': 'Canada', 'CL': 'Chile', 'DE': 'Germany', 'DK': 'Denmark', 'ES': 'Spain',
    'FI': 'Finland', 'FR': 'France', 'GB': 'United Kingdom', 'IT': 'Italy', 'MX': 'Mexico',
    'NL': 'Netherlands', 'NO': 'Norway', 'PT': 'Portugal', 'SE': 'Sweden', 'UY': 'Uruguay', 'US': 'United States'
  };

  // Genre multipliers
  const genreMultipliers = {
    'Phonk': 1.15, 'Pop': 1.10, 'Hip-Hop': 1.08, 'Drum & Bass': 1.05,
    'Techno': 1.02, 'House': 1.02, 'Electronic': 1.00, 'Brazilian Funk': 0.95
  };

  // Platform distribution - Spotify = 55%
  const platformDistribution = {
    'Spotify': 0.55, 'YouTube': 0.20, 'Apple Music': 0.12,
    'TikTok': 0.06, 'Amazon Music': 0.04, 'Other': 0.03
  };

  // Growth scenarios
  const upsideScenarios = {
    'decreasing': { multiplier: 0.6, peakMonth: 2, decayRate: 0.18 },
    'stable': { multiplier: 0.85, peakMonth: 3, decayRate: 0.10 },
    'small_upside': { multiplier: 1.25, peakMonth: 2, decayRate: 0.12 },
    'big_upside': { multiplier: 2.5, peakMonth: 4, decayRate: 0.15 }
  };

  const calculatePredictions = () => {
    // Calculate Spotify revenue per stream
    const spotifyRevenuePerStream = formData.mainMarkets.reduce((acc, market) => 
      acc + (spotifyCountryRates[market] || 0.015), 0) / formData.mainMarkets.length;
    
    const genreMultiplier = genreMultipliers[formData.genre] || 1.0;
    const effectiveSpotifyRate = spotifyRevenuePerStream * genreMultiplier;
    
    // Calculate total revenue per stream (Spotify is 55%)
    const totalRevenuePerStream = effectiveSpotifyRate / 0.55;
    
    const scenario = upsideScenarios[formData.upsideLevel];
    
    // Generate 36-month projection
    const monthlyData = [];
    let cumulativeRevenue = 0;
    let breakEvenMonth = null;
    
    for (let month = 1; month <= 36; month++) {
      let streamMultiplier = 1;
      
      if (month <= scenario.peakMonth) {
        streamMultiplier = 1 + ((scenario.multiplier - 1) * (month / scenario.peakMonth));
      } else {
        const decayMonths = month - scenario.peakMonth;
        streamMultiplier = scenario.multiplier * Math.exp(-scenario.decayRate * decayMonths);
      }
      
      const monthlyStreams = formData.dailySpotifyStreams * 30 * streamMultiplier;
      const monthlyRevenue = monthlyStreams * totalRevenuePerStream;
      cumulativeRevenue += monthlyRevenue;
      
      if (!breakEvenMonth && cumulativeRevenue >= formData.investment) {
        breakEvenMonth = month;
      }
      
      monthlyData.push({
        month: month,
        monthlyStreams: Math.round(monthlyStreams),
        monthlyRevenue: Math.round(monthlyRevenue),
        cumulativeRevenue: Math.round(cumulativeRevenue),
        investment: formData.investment,
        profit: Math.round(cumulativeRevenue - formData.investment)
      });
    }
    
    const finalROI = ((cumulativeRevenue / formData.investment) - 1) * 100;
    const totalStreams = monthlyData.reduce((sum, month) => sum + month.monthlyStreams, 0);
    
    // Calculate suggested price (break-even in 30-36 months)
    const targetBreakEvenMonths = 33; // 2.75 years average
    const revenueAt33Months = monthlyData[32]?.cumulativeRevenue || cumulativeRevenue;
    const suggestedPrice = Math.round(revenueAt33Months * 0.8); // 80% of revenue for safety margin
    
    // Price assessment
    let priceAssessment = 'normal';
    const expectedRevenue = totalStreams * totalRevenuePerStream;
    const priceToRevenueRatio = formData.investment / expectedRevenue;
    
    if (priceToRevenueRatio < 0.3) priceAssessment = 'excellent';
    else if (priceToRevenueRatio < 0.5) priceAssessment = 'good';
    else if (priceToRevenueRatio < 0.8) priceAssessment = 'normal';
    else if (priceToRevenueRatio < 1.2) priceAssessment = 'high';
    else priceAssessment = 'very_high';
    
    // Platform revenue breakdown
    const platformRevenue = Object.entries(platformDistribution).map(([platform, percentage]) => ({
      platform,
      revenue: Math.round(cumulativeRevenue * percentage),
      percentage: percentage * 100
    }));
    
    setPredictions({
      monthlyData, breakEvenMonth, finalROI, totalStreams,
      priceAssessment, platformRevenue, effectiveSpotifyRate,
      totalRevenuePerStream, spotifyRevenuePerStream, genreMultiplier,
      finalRevenue: Math.round(cumulativeRevenue), suggestedPrice,
      isProfitable: finalROI > 0
    });
    
    setShowResults(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMarket = (market) => {
    if (!formData.mainMarkets.includes(market)) {
      setFormData(prev => ({ ...prev, mainMarkets: [...prev.mainMarkets, market] }));
    }
  };

  const removeMarket = (market) => {
    setFormData(prev => ({ ...prev, mainMarkets: prev.mainMarkets.filter(m => m !== market) }));
  };

  const getPriceAssessmentColor = (assessment) => {
    const colors = {
      'excellent': '#22c55e', 'good': '#84cc16', 'normal': '#eab308',
      'high': '#f97316', 'very_high': '#ef4444'
    };
    return colors[assessment] || '#6b7280';
  };

  const getPriceAssessmentText = (assessment) => {
    const texts = {
      'excellent': 'Excellent Deal', 'good': 'Good Price', 'normal': 'Fair Price',
      'high': 'High Price', 'very_high': 'Very High Price'
    };
    return texts[assessment] || 'Unknown';
  };

  const getMarketInfo = (markets) => {
    const avgRate = markets.reduce((acc, market) => acc + (spotifyCountryRates[market] || 0.015), 0) / markets.length;
    if (avgRate >= 0.025) return { color: '#22c55e', text: 'Premium Markets' };
    if (avgRate >= 0.020) return { color: '#84cc16', text: 'Strong Markets' };
    if (avgRate >= 0.015) return { color: '#eab308', text: 'Good Markets' };
    if (avgRate >= 0.010) return { color: '#f97316', text: 'Moderate Markets' };
    return { color: '#ef4444', text: 'Emerging Markets' };
  };

  const availableMarkets = ['US', 'GB', 'NO', 'DK', 'SE', 'NL', 'DE', 'AT', 'BE', 'AU', 'CA', 'FR', 'IT', 'ES', 'PT', 'BR', 'MX', 'CL', 'UY', 'AR', 'FI'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Music Track Profitability Predictor</h1>
          <p className="text-gray-300 text-lg">Predict ROI, break-even timeline, and profitability for music investments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Track Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Song Title</label>
                <input
                  type="text"
                  value={formData.songTitle}
                  onChange={(e) => handleInputChange('songTitle', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400"
                  placeholder="Enter song title"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Investment Amount (DKK)</label>
                <input
                  type="number"
                  value={formData.investment}
                  onChange={(e) => handleInputChange('investment', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Genre</label>
                <select
                  value={formData.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                >
                  {Object.keys(genreMultipliers).map(genre => (
                    <option key={genre} value={genre} className="bg-gray-800">{genre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Daily Spotify Streams</label>
                <input
                  type="number"
                  value={formData.dailySpotifyStreams}
                  onChange={(e) => handleInputChange('dailySpotifyStreams', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Main Markets</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.mainMarkets.map(market => (
                    <span
                      key={market}
                      className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm cursor-pointer hover:bg-blue-600 flex items-center gap-1"
                      onClick={() => removeMarket(market)}
                    >
                      {countryNames[market] || market} 
                      <span className="text-xs opacity-75">
                        ({(spotifyCountryRates[market] || 0.015).toFixed(3)})
                      </span>
                      ×
                    </span>
                  ))}
                </div>
                <select
                  onChange={(e) => addMarket(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  value=""
                >
                  <option value="" className="bg-gray-800">Add market...</option>
                  {availableMarkets.filter(m => !formData.mainMarkets.includes(m)).map(market => (
                    <option key={market} value={market} className="bg-gray-800">
                      {countryNames[market] || market} ({(spotifyCountryRates[market] || 0.015).toFixed(3)} DKK/stream)
                    </option>
                  ))}
                </select>
                {formData.mainMarkets.length > 0 && (
                  <div className="mt-2">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: getMarketInfo(formData.mainMarkets).color }}
                    >
                      {getMarketInfo(formData.mainMarkets).text}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Growth Scenario</label>
                <select
                  value={formData.upsideLevel}
                  onChange={(e) => handleInputChange('upsideLevel', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                >
                  <option value="decreasing" className="bg-gray-800">Decreasing Streams</option>
                  <option value="stable" className="bg-gray-800">Stable Performance</option>
                  <option value="small_upside" className="bg-gray-800">Small Upside (1.25x peak)</option>
                  <option value="big_upside" className="bg-gray-800">Big Upside (2.5x peak)</option>
                </select>
              </div>

              <button
                onClick={calculatePredictions}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Predict Profitability
              </button>
            </div>
          </div>

          {/* Results Panel */}
          {showResults && predictions && (
            <>
              {/* Key Metrics */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Key Predictions</h2>
                
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Price Assessment</span>
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{ backgroundColor: getPriceAssessmentColor(predictions.priceAssessment) }}
                      >
                        {getPriceAssessmentText(predictions.priceAssessment)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Suggested Price (2.5-3yr)</div>
                    <div className="text-2xl font-bold text-green-400">
                      {predictions.suggestedPrice.toLocaleString()} DKK
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Profitability</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        predictions.isProfitable ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {predictions.isProfitable ? 'PROFITABLE' : 'UNPROFITABLE'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Break-even Time</div>
                    <div className="text-2xl font-bold text-white">
                      {predictions.breakEvenMonth ? `${predictions.breakEvenMonth} months` : 'Never'}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">36-Month ROI</div>
                    <div className={`text-2xl font-bold ${
                      predictions.finalROI > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {predictions.finalROI.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Spotify Rate (Avg)</div>
                    <div className="text-xl font-bold text-white">
                      {predictions.spotifyRevenuePerStream.toFixed(6)} DKK/stream
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Total Revenue/Stream</div>
                    <div className="text-xl font-bold text-white">
                      {predictions.totalRevenuePerStream.toFixed(6)} DKK/stream
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Revenue Timeline</h2>
                
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={predictions.monthlyData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="month" stroke="#ffffff80" />
                      <YAxis stroke="#ffffff80" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                        formatter={(value, name) => [
                          `${value.toLocaleString()} DKK`,
                          name === 'cumulativeRevenue' ? 'Cumulative Revenue' : 
                          name === 'investment' ? 'Investment' : 'Monthly Revenue'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulativeRevenue" 
                        stroke="#8b5cf6" 
                        fill="url(#colorRevenue)" 
                        strokeWidth={3}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="investment" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-64">
                  <h3 className="text-lg font-bold text-white mb-4">Platform Revenue Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={predictions.platformRevenue}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ platform, percentage }) => `${platform} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {predictions.platformRevenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                        formatter={(value) => [`${value.toLocaleString()} DKK`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Monthly Breakdown Table */}
        {showResults && predictions && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Monthly Breakdown (First 12 Months)</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2">Month</th>
                    <th className="text-right py-2">Streams</th>
                    <th className="text-right py-2">Monthly Revenue</th>
                    <th className="text-right py-2">Cumulative Revenue</th>
                    <th className="text-right py-2">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.monthlyData.slice(0, 12).map((month, index) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="py-2">{month.month}</td>
                      <td className="text-right py-2">{month.monthlyStreams.toLocaleString()}</td>
                      <td className="text-right py-2">{month.monthlyRevenue.toLocaleString()} DKK</td>
                      <td className="text-right py-2">{month.cumulativeRevenue.toLocaleString()} DKK</td>
                      <td className={`text-right py-2 ${month.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {month.profit >= 0 ? '+' : ''}{month.profit.toLocaleString()} DKK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}