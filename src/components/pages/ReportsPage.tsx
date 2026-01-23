'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChartBarIcon, DocumentArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { reportsApi, placeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import { formatRevenue } from '@/types/device';
import type {
  ReportFilters,
  RevenueReportData,
  DeviceReportData,
  VenueOption,
  ReportTypeConfig,
  TimeRangeConfig
} from '@/types/reports';

const reportTypes: ReportTypeConfig[] = [
  { id: 'revenue', name: '收益报表', description: '分析各场地和设备的收益情况', apiSupported: true },
  { id: 'device', name: '设备运行报表', description: '统计设备运行状态和使用情况', apiSupported: true },
  { id: 'fault', name: '故障统计', description: '设备故障频率和维修记录', apiSupported: false },
  { id: 'usage', name: '使用分析', description: '用户使用行为和偏好分析', apiSupported: false }
];

const timeRanges: TimeRangeConfig[] = [
  { id: 'today', name: '今天' },
  { id: 'yesterday', name: '昨天' },
  { id: 'week', name: '本周' },
  { id: 'month', name: '本月' },
  { id: 'quarter', name: '本季度' },
  { id: 'custom', name: '自定义' }
];

// 这些常量将被动态数据替换
const deviceTypes = ['全部类型', '娃娃机', '推币机', '夹娃娃', '弹珠机'];

// 模拟数据已移除，将使用API数据

export default function ReportsPage() {
  // 基本状态
  const [selectedReportType, setSelectedReportType] = useState<'revenue' | 'device' | 'fault' | 'usage'>('revenue');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'custom'>('month');
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null); // 改为ID
  const [selectedDeviceType, setSelectedDeviceType] = useState<number | null>(null); // 改为ID
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 数据状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueReportData | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceReportData | null>(null);
  const [venueOptions, setVenueOptions] = useState<VenueOption[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Toast hook
  const toast = useToast();

  // 获取报表数据 - 不依赖toast，避免重复调用
  const fetchReportDataInternal = useCallback(async () => {
    if (!reportTypes.find(t => t.id === selectedReportType)?.apiSupported) {
      return { success: false, message: '不支持API的报表类型' };
    }

    setLoading(true);
    setError(null);

    try {
      const filters: ReportFilters = {
        time_range: selectedTimeRange,
        venue_id: selectedVenue || undefined,
        device_type_id: selectedDeviceType || undefined
      };

      if (selectedTimeRange === 'custom') {
        filters.start_date = customStartDate;
        filters.end_date = customEndDate;
      }

      if (selectedReportType === 'revenue') {
        // 清理旧数据
        setDeviceData(null);
        
        const response = await reportsApi.getRevenue(filters);
        if (response.success && response.data) {
          setRevenueData(response.data as RevenueReportData);
          setError(null); // 清除错误状态
          return { success: true, message: '收益报表生成成功' };
        } else {
          setRevenueData(null); // 清理旧数据
          const errorMsg = response.err_message || '获取收益报表数据失败';
          setError(`报表生成失败: ${errorMsg}`);
          return { success: false, message: errorMsg };
        }
      } else if (selectedReportType === 'device') {
        // 清理旧数据
        setRevenueData(null);
        
        const response = await reportsApi.getDevices(filters);
        if (response.success && response.data) {
          setDeviceData(response.data as DeviceReportData);
          setError(null); // 清除错误状态
          return { success: true, message: '设备运行报表生成成功' };
        } else {
          setDeviceData(null); // 清理旧数据
          const errorMsg = response.err_message || '获取设备报表数据失败';
          setError(`报表生成失败: ${errorMsg}`);
          return { success: false, message: errorMsg };
        }
      }
    } catch (err) {
      console.error('获取报表数据失败:', err);
      // 清理所有数据
      setRevenueData(null);
      setDeviceData(null);
      
      // 设置具体的错误信息
      let errorMessage = '网络错误，无法连接到服务器，请检查网络连接后重试';
      if (err instanceof Error) {
        errorMessage = `网络连接失败: ${err.message}`;
      }
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
    return { success: false, message: '未知错误' };
  }, [selectedReportType, selectedTimeRange, selectedVenue, selectedDeviceType, customStartDate, customEndDate]);

  // 包装函数用于手动调用（显示toast）
  const fetchReportData = useCallback(async () => {
    const result = await fetchReportDataInternal();
    if (result.success) {
      toast.success(result.message, '数据已更新，您可以查看最新的报表数据');
    }
  }, [fetchReportDataInternal, toast]);

  // 获取场地选项
  const fetchVenueOptions = useCallback(async () => {
    try {
      const response = await placeApi.getList();
      if (response.success && response.data) {
        const data = response.data as { places?: { id: number; name: string }[] };
        const places = data.places || [];
        setVenueOptions(places.map((place: { id: number; name: string }) => ({
          id: place.id,
          name: place.name
        })));
      }
    } catch (err) {
      console.error('获取场地选项失败:', err);
      // 场地选项获取失败不影响主功能，只记录日志
    }
  }, []);

  // 导出报表
  const handleExport = async (format: 'excel') => {
    if (!reportTypes.find(t => t.id === selectedReportType)?.apiSupported) {
      return;
    }

    setExportLoading(true);
    try {
      const filters: ReportFilters = {
        time_range: selectedTimeRange,
        venue_id: selectedVenue || undefined,
        device_type_id: selectedDeviceType || undefined
      };

      if (selectedTimeRange === 'custom') {
        filters.start_date = customStartDate;
        filters.end_date = customEndDate;
      }

      const { blob, filename } = await reportsApi.export({
        report_type: selectedReportType === 'device' ? 'devices' : 'revenue',
        format,
        filters
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // 显示成功消息
      toast.success('报表导出成功', `文件 ${filename} 已下载完成`);
    } catch (err) {
      console.error('导出报表失败:', err);
      
      // 显示具体的导出错误信息
      if (err instanceof Error) {
        if (err.message.includes('404')) {
          toast.error('导出失败', '导出功能不可用，请联系管理员');
        } else if (err.message.includes('403')) {
          toast.error('导出失败', '没有权限导出报表，请联系管理员');
        } else {
          toast.error('导出失败', err.message);
        }
      } else {
        toast.error('导出失败', '请检查网络连接后重试');
      }
    } finally {
      setExportLoading(false);
    }
  };

  // 生成报表
  const handleGenerateReport = () => {
    fetchReportData(); // 手动点击时显示成功提示
  };

  // 初始化数据
  useEffect(() => {
    fetchVenueOptions();
  }, [fetchVenueOptions]);

  // 初始加载报表数据
  useEffect(() => {
    fetchReportDataInternal(); // 初始加载不显示成功提示
  }, [fetchReportDataInternal]);

  return (
    <>
      <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">报表统计</h1>
        <p className="text-gray-600 mt-1">生成和查看各类运营数据报表</p>
      </div>

      {/* 报表配置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <ChartBarIcon className="w-5 h-5 text-gray-400" />
          <span className="text-lg font-medium text-gray-900">报表配置</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 报表类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">报表类型</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value as 'revenue' | 'device' | 'fault' | 'usage')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* 时间范围 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'custom')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {timeRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.name}
                </option>
              ))}
            </select>
          </div>

          {/* 场地筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">场地</label>
            <select
              value={selectedVenue || ''}
              onChange={(e) => setSelectedVenue(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全部场地</option>
              {venueOptions.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          {/* 设备类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">设备类型</label>
            <select
              value={selectedDeviceType || ''}
              onChange={(e) => setSelectedDeviceType(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全部类型</option>
              {deviceTypes.slice(1).map((type, index) => (
                <option key={type} value={index + 1}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 自定义时间范围 */}
        {selectedTimeRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleGenerateReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChartBarIcon className="w-4 h-4 mr-2" />
            {loading ? '加载中...' : '生成报表'}
          </button>
          {/* <button 
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            打印
          </button>
          <button 
            onClick={handleShare}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            分享
          </button> */}
          <div className="flex space-x-2">
            {/* <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              PDF
            </button> */}
            <button
              onClick={() => handleExport('excel')}
              disabled={exportLoading || !reportTypes.find(t => t.id === selectedReportType)?.apiSupported}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              {exportLoading ? '导出中...' : 'Excel'}
            </button>
            {/* <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              CSV
            </button> */}
          </div>
        </div>
      </div>

      {/* 报表内容 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {reportTypes.find((t) => t.id === selectedReportType)?.name} -
          {timeRanges.find((t) => t.id === selectedTimeRange)?.name}
        </h2>


        {/* 错误状态 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  操作失败
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    type="button"
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                    onClick={handleGenerateReport}
                  >
                    重新生成报表
                  </button>
                  <button
                    type="button"
                    className="text-red-800 hover:text-red-900 text-sm font-medium"
                    onClick={() => setError(null)}
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReportType === 'revenue' && !loading && !error && revenueData && (
          <div className="space-y-6">
            {/* 收益概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{formatRevenue(revenueData.summary.total_revenue)}</p>
                <p className="text-sm text-gray-600 mt-1">总收益</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatRevenue(revenueData.summary.today_revenue)}</p>
                <p className="text-sm text-gray-600 mt-1">今日收益</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className={`text-2xl font-bold ${revenueData.summary.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueData.summary.growth_rate >= 0 ? '+' : ''}{revenueData.summary.growth_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">环比增长</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{formatRevenue(revenueData.summary.avg_device_revenue)}</p>
                <p className="text-sm text-gray-600 mt-1">设备均值</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{revenueData.summary.total_game_points.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">游戏退分</p>
              </div>
            </div>

            {/* 场地收益表格 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      场地
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      今日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      昨日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      本周
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      本月
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      游戏退分
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      增长率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.venue_details.map((venue) => (
                    <tr key={venue.venue_name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venue.venue_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRevenue(venue.today)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRevenue(venue.yesterday)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRevenue(venue.week)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRevenue(venue.month)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {venue.gamePointsMonth.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`${venue.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {venue.growth_rate >= 0 ? '+' : ''}{venue.growth_rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReportType === 'device' && !loading && !error && deviceData && (
          <div className="space-y-6">
            {/* 设备概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{deviceData.summary.total_devices}</p>
                <p className="text-sm text-gray-600 mt-1">总设备数</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{deviceData.summary.active_devices}</p>
                <p className="text-sm text-gray-600 mt-1">活跃设备</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{deviceData.summary.avg_usage_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600 mt-1">平均使用率</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{deviceData.summary.fault_devices}</p>
                <p className="text-sm text-gray-600 mt-1">故障设备</p>
              </div>
            </div>

            {/* 设备类型统计 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      设备类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      总数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      活跃
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      故障数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deviceData.device_type_details.map((device) => (
                    <tr key={device.type}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.active}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${device.usage}%` }}></div>
                          </div>
                          <span className="text-sm text-gray-900">{device.usage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.faults}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 空数据状态 */}
        {selectedReportType === 'revenue' && !loading && !error && revenueData && (!revenueData.venue_details || revenueData.venue_details.length === 0) && (
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无收益报表数据</p>
            <p className="text-sm text-gray-400 mt-2">请尝试调整筛选条件或联系管理员</p>
          </div>
        )}

        {selectedReportType === 'device' && !loading && !error && deviceData && (!deviceData.device_type_details || deviceData.device_type_details.length === 0) && (
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无设备运行数据</p>
            <p className="text-sm text-gray-400 mt-2">请尝试调整筛选条件或联系管理员</p>
          </div>
        )}

        {/* 不支持的报表类型 */}
        {(selectedReportType === 'fault' || selectedReportType === 'usage') && (
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">该报表类型的详细数据正在开发中...</p>
            <p className="text-sm text-gray-400 mt-2">请选择其他报表类型查看数据</p>
          </div>
        )}

        {/* 初始状态 */}
        {!loading && !error && !revenueData && !deviceData && reportTypes.find(t => t.id === selectedReportType)?.apiSupported && (
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">点击&ldquo;生成报表&rdquo;按钮查看数据</p>
            <p className="text-sm text-gray-400 mt-2">您可以先调整筛选条件，然后生成报表</p>
          </div>
        )}
      </div>
      </div>
      
      {/* Toast 容器 */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  );
}
