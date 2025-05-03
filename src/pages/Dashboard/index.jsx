import React, { useState } from "react";
import Sidebar from './SideBar/SideBar';
import Header from './Header/Header';
import Tabs from './Tabs/Tabs';
import Content from './Content/Content';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('configuracoes');
  
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <Header />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <Content activeTab={activeTab} />
      </main>
    </div>
  );
}

export default Dashboard;