import './Kowloon.css';
import KEditor from './KEditor.js';
function Kowloon() {
  return (
    <div className="Kowloon" class="container mx-auto">
	<div class="grid justify-center">
		<section class="px-4">
			<KEditor />
		</section>
	</div>
    </div>
  );
}

export default Kowloon;
