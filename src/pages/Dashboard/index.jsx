import React from "react";
import Sidebar from './SideBar/SideBar';
import Header from './Header/Header';
import Tabs from './Tabs/Tabs';
import Content from './Content/Content';
import styles from './Dashboard.module.css';

function Dashboard() {
    return ( 

        <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <Header />
          <Tabs />
          <Content />
        </main>
      </div>
     );
}

export default Dashboard;