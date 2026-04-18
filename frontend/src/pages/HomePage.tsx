import React from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Stamp, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

const features = [
  {
    icon: PenLine,
    title: 'E-Signature',
    description:
      'Upload a handwritten signature, remove the white background, customise the ink colour, and apply it to PDF or image documents.',
  },
  {
    icon: Stamp,
    title: 'E-Stamp Designer',
    description:
      'Build custom stamps with text, logos, shapes, and borders using a drag-and-drop canvas. Export as high-resolution transparent PNG.',
  },
];

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero */}
      <section className="text-center flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          E-Signature &amp; E-Stamp
          <br />
          <span className="text-brand-600">by Inzozi Partners</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl">
          Create transparent signatures, design custom stamps, and sign documents — all in the
          browser, no data leaves your device for core operations.
        </p>
        <div className="flex gap-3">
          <Link to="/signature">
            <Button icon={<PenLine size={16} />}>Sign a document</Button>
          </Link>
          <Link to="/stamp">
            <Button variant="secondary" icon={<Stamp size={16} />}>
              Design a stamp
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Icon size={20} className="text-brand-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              <Link
                to={title === 'E-Signature' ? '/signature' : '/stamp'}
                className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:underline mt-auto"
              >
                Open <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
