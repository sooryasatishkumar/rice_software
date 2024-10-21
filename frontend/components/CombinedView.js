import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTable } from 'react-table';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/Table.css';

const CombinedView = ({ company, year }) => {
  const [view, setView] = useState('rice'); // Default view
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!company || !year) {
      console.error('Company and year are required to fetch data.');
      return;
    }

    let apiUrl = `http://localhost:5000/api/${view}?company=${company}&year=${year}`;

    axios.get(apiUrl)
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the data!', error);
      });
  }, [view, company, year]);

  useEffect(() => {
    // Handle Escape key press to navigate back
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        navigate(-1); // Navigate back to the previous page
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) {
      return 'Invalid Date';
    }
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  const formatNumber = (value) => {
    return value !== null && value !== undefined ? value.toFixed(3) : '0.000';
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${view} Data`);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, `${view}_data.xlsx`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      axios.delete(`http://localhost:5000/api/${view}/${id}?company=${company}&year=${year}`)
        .then(response => {
          alert(`${view.charAt(0).toUpperCase() + view.slice(1)} entry deleted successfully!`);
          setData(data.filter(entry => entry.id !== id)); // Remove the deleted entry from the list
        })
        .catch(error => {
          console.error(`There was an error deleting the ${view} entry!`, error);
        });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = React.useMemo(() => {
    if (view === 'rice') {
      return [
        { Header: 'AD Date', accessor: 'adDate', Cell: ({ value }) => formatDate(value) },
        { Header: 'Godown', accessor: 'godown' },
        { Header: 'Truck Memo No', accessor: 'challanNo' },
        { Header: 'Truck Memo Date', accessor: 'date', Cell: ({ value }) => formatDate(value) },
        { Header: 'Moisture %', accessor: 'moisture', Cell: ({ value }) => formatNumber(value) },
        { Header: 'Variety', accessor: 'variety' },
        { Header: 'Total Bags', accessor: 'totalBags', Cell: ({ row }) => {
          const onbBags = parseInt(row.original.onbBags) || 0;
          const ssBags = parseInt(row.original.ssBags) || 0;
          const swpBags = parseInt(row.original.swpBags) || 0;
          return onbBags + ssBags + swpBags;
        }},
        { Header: 'Kgs', accessor: 'tonsKgs', Cell: ({ value }) => formatNumber(value) },
        { Header: 'FRK Kgs', accessor: 'frk', Cell: ({ value }) => formatNumber(value) },
        { Header: 'Total (Tons/Kgs)', accessor: 'total', Cell: ({ row }) => {
          const tonsKgs = parseFloat(row.original.tonsKgs) || 0;
          const frk = parseFloat(row.original.frk) || 0;
          return formatNumber(tonsKgs + frk);
        }},
        { Header: 'AD No', accessor: 'adNumber' },
        { Header: 'Lorry No', accessor: 'lorryNo' },
        { Header: 'Bags (ONB)', accessor: 'onbBags' },
        { Header: 'Bags (SS)', accessor: 'ssBags' },
        { Header: 'Bags (SWP)', accessor: 'swpBags' },
        { Header: 'Progressive Total Bags', accessor: 'progTotalBags', Cell: ({ row }) => {
          let cumulativeBags = 0;
          for (let i = 0; i <= row.index; i++) {
            const onbBags = parseInt(data[i].onbBags) || 0;
            const ssBags = parseInt(data[i].ssBags) || 0;
            const swpBags = parseInt(data[i].swpBags) || 0;
            cumulativeBags += onbBags + ssBags + swpBags;
          }
          return cumulativeBags;
        }},
        { Header: 'Progressive Total Kgs (excluding FRK)', accessor: 'progTotalKgs', Cell: ({ row }) => {
          let cumulativeKgs = 0;
          for (let i = 0; i <= row.index; i++) {
            cumulativeKgs += parseFloat(data[i].tonsKgs) || 0;
          }
          return formatNumber(cumulativeKgs);
        }},
        {
          Header: 'Actions',
          accessor: 'id',
          Cell: ({ value }) => (
            <button onClick={() => handleDelete(value)}>Delete</button>
          ),
        },
      ];
    }

    if (view === 'paddy') {
      return [
        { Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDate(value) },
        { Header: 'Godown', accessor: 'godown' },
        { Header: 'Issue Memo No.', accessor: 'issueMemoId' },
        { Header: 'Variety', accessor: 'grade' },
        { Header: 'Moisture %', accessor: 'moisture', Cell: ({ value }) => formatNumber(value) },
        { Header: 'Total Bags', accessor: 'totalBags', Cell: ({ row }) => {
          const onbBags = parseInt(row.original.onbBags) || 0;
          const ssBags = parseInt(row.original.ssBags) || 0;
          const swpBags = parseInt(row.original.swpBags) || 0;
          const nbBags = parseInt(row.original.nbBags) || 0;
          return onbBags + ssBags + swpBags + nbBags;
        }},
        { Header: 'Kgs/Gms', accessor: 'tonsKgs', Cell: ({ value }) => formatNumber(value) },
        { Header: 'Bags (NB)', accessor: 'nbBags' },
        { Header: 'Bags (ONB)', accessor: 'onbBags' },
        { Header: 'Bags (SS)', accessor: 'ssBags' },
        { Header: 'Bags (SWP)', accessor: 'swpBags' },
        { Header: 'Lorry No', accessor: 'lorryNo' },
        { Header: 'Progressive Total Bags', accessor: 'progTotalBags', Cell: ({ row }) => {
          let cumulativeBags = 0;
          for (let i = 0; i <= row.index; i++) {
            const onbBags = parseInt(data[i].onbBags) || 0;
            const ssBags = parseInt(data[i].ssBags) || 0;
            const swpBags = parseInt(data[i].swpBags) || 0;
            const nbBags = parseInt(data[i].nbBags) || 0;
            cumulativeBags += onbBags + ssBags + swpBags + nbBags;
          }
          return cumulativeBags;
        }},
        { Header: 'Progressive Kgs/Gms', accessor: 'progKgsGms', Cell: ({ row }) => {
          const tonsKgs = parseFloat(row.original.tonsKgs) || 0;
          let cumulativeKgs = 0;
          for (let i = 0; i <= row.index; i++) {
            cumulativeKgs += parseFloat(data[i].tonsKgs) || 0;
          }
          return formatNumber(cumulativeKgs);
        }},
        {
          Header: 'Actions',
          accessor: 'id',
          Cell: ({ value }) => (
            <button onClick={() => handleDelete(value)}>Delete</button>
          ),
        },
      ];
    }

    if (view === 'frk') {
      return [
        { Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDate(value) },
        { Header: 'FRK Stock (KGs)', accessor: 'KGs', Cell: ({ value }) => formatNumber(value) },
        { Header: 'FRK Debited (KGs)', accessor: 'debited_KGs', Cell: ({ value }) => formatNumber(value) },
        { Header: 'Remaining FRK (KGs)', accessor: 'remaining_KGs', Cell: ({ value }) => formatNumber(value) },
        {
          Header: 'Actions',
          accessor: 'id',
          Cell: ({ value }) => (
            <button onClick={() => handleDelete(value)}>Delete</button>
          ),
        },
      ];
    }

    // Default return if none of the views match
    return [];
  }, [view, data]);

  const tableInstance = useTable({ columns, data });

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = tableInstance;

  return (
    <div className="table-container">
      <h2>Select Data View</h2>
      <select value={view} onChange={(e) => setView(e.target.value)}>
        <option value="rice">Rice Entries</option>
        <option value="paddy">Paddy Entries</option>
        <option value="frk">FRK Entries</option>
      </select>
      <button onClick={exportToExcel}>Export to Excel</button>
      <button onClick={handlePrint}>Print</button> {/* Add Print button */}
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th key={column.id} {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td key={cell.column.id} {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CombinedView;
