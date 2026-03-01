import React from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';

const TOPICS = [
  { id: 'anayasa', label: 'Constitution', value: 45, url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.2709.pdf' },
  { id: 'ceza', label: 'Penal Code', value: 38, url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5237.pdf' },
  { id: 'medeni', label: 'Civil Code', value: 32, url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.4721.pdf' },
  { id: 'is', label: 'Labor Code', value: 25, url: 'https://www.mevzuat.gov.tr/MevzuatMetin/1.5.4857.pdf' },
];

// Provides quick links to important legal resources and portals.
function Integrations() {
  const max = Math.max(...TOPICS.map((t) => t.value));
  const uyapUrl = 'https://avukatbeta.uyap.gov.tr/giris';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Legal Resources</h2>
        <p className="text-dark-500 mt-1">Quick access to Turkish law codes and constitutional documents.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-dark-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-dark-900">UYAP Portal</h3>
              <p className="text-sm text-dark-600">Access the Turkish National Judiciary Informatics System.</p>
            </div>
          </div>
          <a href={uyapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold">
            <ExternalLink className="w-4 h-4" />
            Open UYAP
          </a>
        </div>

        <p className="text-sm text-dark-700 mb-4">Access the UYAP system or explore Turkish legal resources below.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOPICS.map((topic) => (
            <div key={topic.id} className="p-4 border rounded-lg bg-primary-50 border-primary-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-dark-900">{topic.label}</h4>
                  <p className="text-sm text-dark-600 mt-1">Open related materials in UYAP</p>
                </div>
                <a href={topic.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 bg-primary-600 text-white rounded-md text-sm">
                  Open
                </a>
              </div>


            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-dark-100 p-6">
        <h3 className="text-xl font-bold text-dark-900 mb-3de text-dark-6">About</h3>
        <ul className="list-disc list-insi00">
          <li>Quick access to official Turkish law codes and documents.</li>
          <li>All resources link to mevzuat.gov.tr or official government sources.</li>
          <li>UYAP portal provides access to the Turkish Judiciary Information System.</li>
        </ul>
      </div>
    </div>
  );
}

export default Integrations;
