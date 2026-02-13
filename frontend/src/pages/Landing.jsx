import React from 'react';
import LVMHSlider from '../components/LVMHSlider';
import ExecutiveImpactCarousel from '../components/ExecutiveImpactCarousel';

export default function Landing() {
    return (
        <div className="landing-root">
            <LVMHSlider />
            <ExecutiveImpactCarousel />
        </div>
    );
}
