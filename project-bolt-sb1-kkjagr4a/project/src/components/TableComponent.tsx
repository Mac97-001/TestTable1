import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Filter, Edit3, Check, X } from 'lucide-react';
import { TableData, TableCell, FilterCriteria, SortConfig } from '../types';

interface TableComponentProps {
  data: TableData;
  onDataChange: (newData: TableData) => void;
}

export const TableComponent: React.FC<TableComponentProps> = ({ data, onDataChange }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleSort = (columnIndex: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.column === columnIndex && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column: columnIndex, direction });
  };

  const handleFilter = (column: number, operator: FilterCriteria['operator'], value: number) => {
    setFilterCriteria({ column, operator, value });
    setShowFilter(false);
  };

  const clearFilter = () => {
    setFilterCriteria(null);
  };

  const startEditing = (cellId: string, currentValue: number) => {
    setEditingCell(cellId);
    setEditValue(currentValue.toString());
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    const newValue = parseInt(editValue);
    if (isNaN(newValue)) return;

    const newData = { ...data };
    newData.rows = newData.rows.map(row =>
      row.map(cell =>
        cell.id === editingCell ? { ...cell, value: newValue } : cell
      )
    );
    
    onDataChange(newData);
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const getFilteredAndSortedRows = useCallback(() => {
    let filteredRows = [...data.rows];

    if (filterCriteria) {
      filteredRows = filteredRows.filter(row => {
        const cellValue = row[filterCriteria.column].value;
        switch (filterCriteria.operator) {
          case 'gt': return cellValue > filterCriteria.value;
          case 'lt': return cellValue < filterCriteria.value;
          case 'eq': return cellValue === filterCriteria.value;
          case 'gte': return cellValue >= filterCriteria.value;
          case 'lte': return cellValue <= filterCriteria.value;
          default: return true;
        }
      });
    }

    if (sortConfig) {
      filteredRows.sort((a, b) => {
        const aValue = a[sortConfig.column].value;
        const bValue = b[sortConfig.column].value;
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    return filteredRows;
  }, [data.rows, sortConfig, filterCriteria]);

  const FilterDropdown = ({ columnIndex }: { columnIndex: number }) => (
    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10 min-w-48">
      <h4 className="font-semibold text-gray-700 mb-3">Filter {data.headers[columnIndex]}</h4>
      <div className="space-y-2">
        {[
          { label: 'Greater than', op: 'gt' as const },
          { label: 'Less than', op: 'lt' as const },
          { label: 'Equal to', op: 'eq' as const },
          { label: 'Greater or equal', op: 'gte' as const },
          { label: 'Less or equal', op: 'lte' as const },
        ].map(({ label, op }) => (
          <div key={op} className="flex items-center gap-2">
            <select
              className="text-xs bg-gray-50 border rounded px-2 py-1"
              onChange={(e) => e.target.value && handleFilter(columnIndex, op, parseInt(e.target.value))}
            >
              <option value="">{label}</option>
              {Array.from(new Set(data.rows.map(row => row[columnIndex].value)))
                .sort((a, b) => a - b)
                .map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
            </select>
          </div>
        ))}
      </div>
      <button
        onClick={clearFilter}
        className="mt-3 text-xs text-gray-500 hover:text-gray-700"
      >
        Clear Filter
      </button>
    </div>
  );

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
            <tr>
              {data.headers.map((header, index) => (
                <th key={index} className="relative px-6 py-4 text-left text-sm font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <span>{header}</span>
                    <button
                      onClick={() => handleSort(index)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      {sortConfig?.column === index ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronUp className="w-4 h-4 opacity-50" />
                      )}
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowFilter(showFilter === index ? false : index)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        <Filter className="w-4 h-4" />
                      </button>
                      {showFilter === index && <FilterDropdown columnIndex={index} />}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {getFilteredAndSortedRows().map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-blue-50/50 transition-colors">
                {row.map((cell) => (
                  <td key={cell.id} className="px-6 py-4">
                    {editingCell === cell.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          className="w-20 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          placeholder="Enter value"
                        />
                        <button
                          onClick={saveEdit}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                          title="Save (Enter)"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Cancel (Escape)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 group cursor-pointer"
                        onClick={() => startEditing(cell.id, cell.value)}
                      >
                        <span 
                          className="text-gray-900 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors min-w-[2rem] text-center"
                          title="Click to edit"
                        >
                          {cell.value}
                        </span>
                        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity" />
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filterCriteria && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Filtering {data.headers[filterCriteria.column]} {filterCriteria.operator} {filterCriteria.value}
            </span>
            <button
              onClick={clearFilter}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}
      
      <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
        <div className="text-xs text-gray-500 flex items-center gap-4">
          <span>💡 Tips:</span>
          <span>Click any number to edit</span>
          <span>Press Enter to save</span>
          <span>Press Escape to cancel</span>
        </div>
      </div>
    </div>
  );
};