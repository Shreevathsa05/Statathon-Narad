import {HashRouter as Router, Routes, Route, Link} from 'react-router'
function App() {

  return (
    <>
    <Router>
      <nav>
        <Link to='/'>Home</Link>
        <Link to='/a'>A</Link>
        <Link to='/b'>B</Link>
      </nav>
      <Routes>
        <Route path='/' element={<>Home / List of surveys with links to dashboard</>} />
        <Route path='/a' element={<>Survey Generator / Question validator</>} />
        <Route path='/b' element={<>Publish / dashboard</>} />
      </Routes>
    </Router>
    </>
  )
}

export default App
