import { Routes, Route } from 'react-router-dom'
import Home from './pages/forum/Home.jsx'
import Explore from './pages/forum/Explore.jsx'
import Detail from './pages/forum/Detail.jsx'
import Ask from './pages/forum/Ask.jsx'
import Search from './pages/forum/Search.jsx'
import Dashboard from './pages/forum/Dashboard.jsx'
import Login from './pages/forum/Login.jsx'
import Register from './pages/forum/Register.jsx'
import { ForumAppProvider } from './contexts/ForumAppContext.jsx'
import ForumLayout from './layouts/ForumLayout.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ForumAppProvider><ForumLayout /></ForumAppProvider>}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="detail/:id" element={<Detail />} />
        <Route path="ask" element={<Ask />} />
        <Route path="search" element={<Search />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  )
}
