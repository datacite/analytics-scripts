import { expect } from 'chai';
import * as Analytics from '@/lib/analytics-scripts.js';

describe('Detect DOI', () => {
  it('checks looks for DOI in attributes', () => {

    expect(wrapper.find('a').text()).to.include('10.123/24f5');
  });

  it('checks looks for DOI in schema.org', () => {

    expect(wrapper.find('a').text()).to.include('10.123/24f5');
  });

  it('checks looks for DOI in dublicCore', () => {

    expect(wrapper.find('a').text()).to.include('10.123/24f5');
  });

  it('checks looks for DOI in URL', () => {

    expect(wrapper.find('a').text()).to.include('10.123/24f5');
  });
});
