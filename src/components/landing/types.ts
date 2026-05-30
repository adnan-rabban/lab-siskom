export interface Practicum {
  id: string;
  title: string;
  titleId: string;
  moduleCode: string;
  description: string;
  descriptionId: string;
  category: 'analog' | 'digital' | 'telecom';
  status: 'active' | 'coming-soon';
  tags: string[];
  route: string;
  instruments?: string[];
}