import Navbar from './Navbar'
import Sidebar from './Sidebar'

const Layout = ({ children, showSidebar = false, fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="h-full w-full">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {showSidebar && <Sidebar />}
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout