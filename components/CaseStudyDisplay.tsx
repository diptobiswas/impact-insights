import React from 'react';
import { CaseStudy } from '@/lib/types';

interface CaseStudyDisplayProps {
  caseStudies: CaseStudy[];
}


interface CaseStudyDisplayProps {
  caseStudies: CaseStudy[];
}

const CaseStudyDisplay: React.FC<CaseStudyDisplayProps> = ({ caseStudies }) => {
  if (caseStudies.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-bold mb-4 hidden sm:block">Relevant Case Studies</h2>
      <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 w-max">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className="shrink-0 w-64 p-4 border rounded-2xl shadow-sm transition-colors duration-200 hover:bg-gray-50 cursor-pointer"
              >
                <h3 className="text-lg font-semibold mb-2">{study.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{study.domain}</p>
                <a
                  href={study.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-block"
                >
                  Learn more
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default CaseStudyDisplay;