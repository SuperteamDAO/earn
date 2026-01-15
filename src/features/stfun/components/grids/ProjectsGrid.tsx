'use client';

import { useMemo, useState } from 'react';

import ProjectCard from '../cards/ProjectCard';
import Dropdown from './Dropdown';

interface Project {
  fields: {
    Name: string;
    Tagline: string;
    'Project Link': string;
    'Project Twitter': string;
    'Logo Link': string;
    Country: string;
    Rank: number;
  };
}

interface ProjectsGridProps {
  projects: Project[];
}

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [selectedCountry, setSelectedCountry] = useState('');

  // Sort projects by rank
  const sortedProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return [...projects].sort((a, b) => a.fields.Rank - b.fields.Rank);
  }, [projects]);

  // Filter projects by country
  const filteredProjects = useMemo(() => {
    if (!selectedCountry) return sortedProjects;
    return sortedProjects.filter(
      (project) => project.fields.Country === selectedCountry,
    );
  }, [sortedProjects, selectedCountry]);

  // Get unique countries
  const countries = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return Array.from(
      new Set(projects.map((project) => project.fields.Country)),
    );
  }, [projects]);

  // Calculate offset classes for masonry effect
  const getOffsetClasses = (index: number) => {
    const offsetArray = new Array(filteredProjects.length).fill(false);
    offsetArray[1] = true;
    for (let i = 2; i < filteredProjects.length; i++) {
      offsetArray[i] = (i - 1) % 3 === 0;
    }

    if (offsetArray[index] && index % 2 === 0) {
      return 'mt-0 md:mt-8';
    }
    if (offsetArray[index] && index % 2 === 1) {
      return 'mt-0 lg:mt-8';
    }
    if (!offsetArray[index] && index % 2 === 0) {
      return 'mt-0 md:mt-8 lg:mt-0';
    }
    return 'mt-0';
  };

  return (
    <>
      <div className="z-50 mt-12">
        <p className="font-primary text-center font-medium text-white">
          Filter by Country
        </p>
        <Dropdown
          countries={countries}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />
      </div>

      <div className="z-20 mt-[42px] flex items-center justify-center">
        <div className="grid-cards-container flex flex-col gap-8 md:grid md:gap-0">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.fields.Name}
              name={project.fields.Name}
              tagline={project.fields.Tagline}
              projectLink={project.fields['Project Link']}
              twitterLink={project.fields['Project Twitter']}
              imgUrl={project.fields['Logo Link']}
              country={project.fields.Country}
              className={`col-span-1 row-span-1 ${getOffsetClasses(index)}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
