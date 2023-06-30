//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import Header from '../Header/Header'
import Navigation from '../Navigation/Navigation'

export default function AppLayout({ children }) {

  return (
    <div className="layout-wrapper">
      <div className="sidebar-wrapper">
        <div className="header-wrapper">
          <Header />
        </div>
        <div className="navigate-wrapper">
          <Navigation />
        </div>
      </div>
      <div className="content-wrapper">
        <main>{children}</main>
      </div>
    </div>
  )
}
