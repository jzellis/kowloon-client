import './App.css';
import KEditor from './components/KEditor.js';
function App() {
  return (
    <div className="App" class="container mx-auto">
	<div class="grid grid-cols-3 justify-center space-x-2">
		<section class="text-white bg-gray-300 px-4">
			Kowloon
		</section>
		<section class="col-span-2 px-4">
		<KEditor />
		</section>
	</div>
    </div>
  );
}

export default App;
