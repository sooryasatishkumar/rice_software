import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTable } from 'react-table';
import '../styles/Table.css';

const ViewDataFRK = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/frk')
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the data!', error);
      });
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) {
      return 'Invalid Date';
    }
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      axios.delete(`http://localhost:5000/api/frk/${id}`)
        .then(response => {
          alert('FRK entry deleted successfully!');
          setData(data.filter(entry => entry.id !== id)); // Remove the deleted entry from the list
        })
        .catch(error => {
          console.error('There was an error deleting the FRK entry!', error);
        });
    }
  };

  const columns = React.useMemo(() => [
    { Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDate(value) },
    { Header: 'Company', accessor: 'company' },
    { Header: 'Year', accessor: 'year' },
    { Header: 'FRK Stock (KGs)', accessor: 'KGs' },
    { Header: 'FRK Debited (KGs)', accessor: 'debited_KGs' },
    { Header: 'Remaining FRK (KGs)', accessor: 'remaining_KGs' },
    { Header: 'Progressive FRK (KGs)', accessor: 'progressive_FRK' },
    {
      Header: 'Actions',
      accessor: 'id',
      Cell: ({ value }) => (
        <button onClick={() => handleDelete(value)}>Delete</button>
      ),
    },
  ], [data]);

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
      <h2>FRK Stock Details</h2>
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

export default ViewDataFRK;
