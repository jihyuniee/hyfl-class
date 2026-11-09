'use client';

import { useEffect, useRef } from 'react';
import AdmissionsNav from './AdmissionsNav';
import markup from './nativeExplorerMarkup.json';
import { mountAdmissionsExplorer } from './nativeExplorerRuntime';
import './nativeExplorer.css';

export default function NativeAdmissionsExplorer({ university = '', section = '' }: { university?: string; section?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    return mountAdmissionsExplorer(root.current, university, section);
  }, [university, section]);
  return <>
    <AdmissionsNav current="regular" />
    <div ref={root} className="admissions-native" dangerouslySetInnerHTML={{ __html: markup }} />
  </>;
}
