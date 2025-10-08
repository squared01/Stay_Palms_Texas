import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface AccessibleDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption: string;
  searchable?: boolean;
  exportable?: boolean;
  pageSize?: number;
  className?: string;
  onRowClick?: (row: T) => void;
  rowKeyField: keyof T;
}

export function AccessibleDataTable<T extends Record<string, any>>({
  data,
  columns,
  caption,
  searchable = true,
  exportable = false,
  pageSize = 10,
  className = "",
  onRowClick,
  rowKeyField,
}: AccessibleDataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search
    if (searchTerm) {
      result = result.filter(row =>
        columns.some(column => {
          const value = row[column.key];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter(row =>
          String(row[key]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    return result;
  }, [data, searchTerm, filters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.header).join(',');
    const rows = sortedData.map(row =>
      columns.map(col => {
        const value = row[col.key];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : String(value);
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search table..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search table data"
              />
            </div>
          )}
          
          <span className="text-sm text-gray-600">
            Showing {paginatedData.length} of {sortedData.length} results
          </span>
        </div>

        {exportable && (
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Export table data to CSV"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full divide-y divide-gray-200" role="table">
          <caption className="sr-only">{caption}</caption>
          
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.width || ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {column.header}
                        <span className="flex flex-col">
                          <ChevronUp 
                            className={`w-3 h-3 ${
                              sortConfig.key === column.key && sortConfig.direction === 'asc'
                                ? 'text-blue-600' 
                                : 'text-gray-300'
                            }`}
                          />
                          <ChevronDown 
                            className={`w-3 h-3 -mt-1 ${
                              sortConfig.key === column.key && sortConfig.direction === 'desc'
                                ? 'text-blue-600' 
                                : 'text-gray-300'
                            }`}
                          />
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                    
                    {column.filterable && (
                      <div className="relative">
                        <Filter className="w-3 h-3 text-gray-400" />
                        <input
                          type="text"
                          value={filters[String(column.key)] || ''}
                          onChange={(e) => handleFilter(String(column.key), e.target.value)}
                          placeholder="Filter..."
                          className="absolute top-6 left-0 z-10 w-32 px-2 py-1 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500"
                          aria-label={`Filter ${column.header}`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={String(row[rowKeyField])}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  `}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  aria-label={onRowClick ? `View details for row ${index + 1}` : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key])
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Page</span>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Select page"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">of {totalPages}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Go to previous page"
            >
              Previous
            </button>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}