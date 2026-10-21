import Header from './components/Header.tsx';
import Hero from './components/Hero.tsx';
import Footer from './components/Footer.tsx';
import './index.css';


function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        {/* Additional components will go here */}
      </main>
      <Footer />
    </>
  );
}


export default App;