import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Anonymization } from './features/anonymization/anonymization';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Anonymization],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('data-anon-portal');
}
