export interface Practicum {
  id: string;
  title: string;
  titleId: string;
  moduleCode: string;
  description: string;
  descriptionId: string;
  category: 'analog' | 'digital' | 'telecom';
  status: 'coming-soon';
  tags: string[];
}
