import config from '../../../config.js';
import { Citizen } from '../../citizen.js';
import { City } from '../../city.js';
import { Zone } from '../../buildings/zones/zone.js';
import { DevelopmentState } from './development.js';
import { SimModule } from './simModule.js';

export class JobsModule extends SimModule {
  /**
   * @type {Zone}
   */
  #zone;

    // If building is abandoned, 

  




  /**
   * Returns an HTML representation of this object
   * @returns {string}
   */
  toHTML() {
    let html = `<div class="info-heading">Workers (${this.filledJobs}/${this.maxWorkers})</div>`;

    html += '<ul class="info-citizen-list">';
    for (const worker of this.workers) {
      html += worker.toHTML();
    }
    html += '</ul>';

    return html;
  }
}