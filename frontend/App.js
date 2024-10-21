import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CompanyYearSelection from './components/CompanyYearSelection';
import RiceEntryForm from './components/RiceEntryForm';
import PaddyEntryForm from './components/PaddyEntryForm';
import FRKEntryForm from './components/FRKEntryForm';
import CombinedView from './components/CombinedView';
import OutturnTable from './components/OutturnTable';
import ViewDataFRK from './components/ViewDataFRK';
import './styles/App.css';

const App = () => {
  const [company, setCompany] = useState('');
  const [year, setYear] = useState('');

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={<CompanyYearSelection setCompany={setCompany} setYear={setYear} />}
          />
          <Route
            path="/home"
            element={
              <div>
                <h1>Welcome</h1>
                <p>Company: {company}</p>
                <p>Year: {year}</p>
                <nav>
                  <ul className="entries">
                    <li><Link to="/rice">Rice Entry</Link></li>
                    <li><Link to="/paddy">Paddy Entry</Link></li>
                    <li><Link to="/frk-entry">FRK Entry</Link></li>
                  </ul>
                  <ul className="views">
                    <li><Link to="/view">Data Tables</Link></li>
                    <li><Link to="/outturn">Outturn Tables</Link></li>
                  </ul>
                </nav>
              </div>
            }
          />
          <Route path="/rice" element={<RiceEntryForm company={company} year={year} />} />
          <Route path="/paddy" element={<PaddyEntryForm company={company} year={year} />} />
          <Route path="/frk-entry" element={<FRKEntryForm company={company} year={year} />} />
          <Route path="/view" element={<CombinedView company={company} year={year} />} />
          <Route path="/outturn" element={<OutturnTable company={company} year={year} />} />
          <Route path="/frk-view" element={<ViewDataFRK company={company} year={year} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
