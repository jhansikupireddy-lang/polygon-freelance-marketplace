import React, { useEffect, useRef, useState } from 'react';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import { Sparkles, Zap, Layers, MousePointer, Eye, Code } from 'lucide-react';
import { animate, remove, stagger } from 'animejs';

const AnimationShowcase = () => {
    const {
        staggerFadeIn,
        slideInLeft,
        slideInRight,
        scaleIn,
        rotateIn,
        float,
        glitch,
        bounceIn,
        pulse,
        magneticButton,
        revealOnScroll,
    } = useAnimeAnimations();

    const [activeDemo, setActiveDemo] = useState(null);
    const magneticRef = useRef(null);
    const floatingRef = useRef(null);
    const glitchRef = useRef(null);

    useEffect(() => {
        // Initialize animations on mount
        slideInLeft('.showcase-header');
        setTimeout(() => {
            staggerFadeIn('.demo-card', 150);
        }, 300);

        // Floating animation
        if (floatingRef.current) {
            float(floatingRef.current, 15);
        }

        // Magnetic button effect
        if (magneticRef.current) {
            const cleanup = magneticButton(magneticRef);
            return cleanup;
        }

        // Setup scroll reveals
        const cleanupScroll = revealOnScroll('.reveal-item');
        return cleanupScroll;
    }, []);

    const runAnimation = (type) => {
        setActiveDemo(type);
        const target = `.demo-target-${type}`;

        switch (type) {
            case 'stagger':
                remove(target);
                document.querySelectorAll(target).forEach(el => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(20px)';
                });
                setTimeout(() => staggerFadeIn(target, 100), 100);
                break;

            case 'scale':
                remove(target);
                document.querySelector(target).style.opacity = '0';
                document.querySelector(target).style.transform = 'scale(0.8)';
                setTimeout(() => scaleIn(target), 100);
                break;

            case 'bounce':
                remove(target);
                document.querySelector(target).style.opacity = '0';
                document.querySelector(target).style.transform = 'scale(0)';
                setTimeout(() => bounceIn(target), 100);
                break;

            case 'rotate':
                remove(target);
                document.querySelector(target).style.opacity = '0';
                document.querySelector(target).style.transform = 'rotate(-90deg)';
                setTimeout(() => rotateIn(target), 100);
                break;

            case 'slide-left':
                remove(target);
                document.querySelector(target).style.opacity = '0';
                document.querySelector(target).style.transform = 'translateX(-50px)';
                setTimeout(() => slideInLeft(target), 100);
                break;

            case 'slide-right':
                remove(target);
                document.querySelector(target).style.opacity = '0';
                document.querySelector(target).style.transform = 'translateX(50px)';
                setTimeout(() => slideInRight(target), 100);
                break;

            case 'glitch':
                if (glitchRef.current) {
                    glitch(glitchRef.current);
                }
                break;

            default:
                break;
        }
    };

    const demos = [
        {
            id: 'stagger',
            title: 'Stagger Fade In',
            description: 'Elements fade in sequentially with a delay',
            icon: Layers,
            color: 'primary',
        },
        {
            id: 'scale',
            title: 'Scale In',
            description: 'Element scales from small to full size',
            icon: Zap,
            color: 'secondary',
        },
        {
            id: 'bounce',
            title: 'Bounce In',
            description: 'Elastic bounce effect on entry',
            icon: Sparkles,
            color: 'accent',
        },
        {
            id: 'rotate',
            title: 'Rotate In',
            description: 'Element rotates into view',
            icon: Code,
            color: 'primary',
        },
        {
            id: 'slide-left',
            title: 'Slide Left',
            description: 'Slides in from the left',
            icon: MousePointer,
            color: 'secondary',
        },
        {
            id: 'slide-right',
            title: 'Slide Right',
            description: 'Slides in from the right',
            icon: Eye,
            color: 'accent',
        },
    ];

    return (
        <div className="container">
            <header className="showcase-header mb-20">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                        <Sparkles size={40} />
                    </div>
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase">
                            Animation <span className="gradient-text">Showcase</span>
                        </h1>
                        <p className="text-text-muted font-bold text-sm mt-2">
                            Powered by Anime.js • 20+ Premium Effects
                        </p>
                    </div>
                </div>
            </header>

            {/* Interactive Demos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {demos.map((demo, index) => (
                    <div
                        key={demo.id}
                        className="demo-card glass-card p-8 hover-lift cursor-pointer"
                        onClick={() => runAnimation(demo.id)}
                    >
                        <div className={`p-3 rounded-2xl bg-${demo.color}/10 text-${demo.color} w-fit mb-4`}>
                            <demo.icon size={24} />
                        </div>
                        <h3 className="text-xl font-black mb-2">{demo.title}</h3>
                        <p className="text-text-dim text-sm mb-6">{demo.description}</p>

                        {/* Demo Target */}
                        <div className="border border-white/10 rounded-2xl p-6 bg-white/5 min-h-[120px] flex items-center justify-center">
                            {demo.id === 'stagger' ? (
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div
                                            key={i}
                                            className={`demo-target-${demo.id} w-12 h-12 rounded-xl bg-gradient-to-br from-${demo.color} to-${demo.color}/50`}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div
                                    className={`demo-target-${demo.id} w-20 h-20 rounded-2xl bg-gradient-to-br from-${demo.color} to-${demo.color}/50 flex items-center justify-center`}
                                >
                                    <demo.icon size={32} className="text-white" />
                                </div>
                            )}
                        </div>

                        <button className="btn-ghost w-full mt-4 !py-2 text-xs">
                            Run Animation
                        </button>
                    </div>
                ))}
            </div>

            {/* Special Effects Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                {/* Floating Animation */}
                <div className="glass-card p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-dim mb-6">
                        Floating Effect
                    </h3>
                    <div className="flex justify-center py-12">
                        <div
                            ref={floatingRef}
                            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl"
                        >
                            <Sparkles size={40} className="text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-text-dim text-center">
                        Continuous floating animation
                    </p>
                </div>

                {/* Magnetic Button */}
                <div className="glass-card p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-dim mb-6">
                        Magnetic Button
                    </h3>
                    <div className="flex justify-center py-12">
                        <button
                            ref={magneticRef}
                            className="btn-primary !px-8 !py-4 magnetic-button"
                        >
                            <MousePointer size={20} />
                            Hover Me
                        </button>
                    </div>
                    <p className="text-xs text-text-dim text-center">
                        Follows your cursor on hover
                    </p>
                </div>

                {/* Glitch Effect */}
                <div className="glass-card p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-dim mb-6">
                        Glitch Effect
                    </h3>
                    <div className="flex justify-center py-12">
                        <div
                            ref={glitchRef}
                            className="text-4xl font-black gradient-text"
                            onClick={() => runAnimation('glitch')}
                        >
                            ZENITH
                        </div>
                    </div>
                    <p className="text-xs text-text-dim text-center">
                        Click to trigger glitch
                    </p>
                </div>
            </div>

            {/* Scroll Reveal Demo */}
            <div className="mb-20">
                <h2 className="text-3xl font-black mb-8 text-center">
                    Scroll <span className="text-primary">Reveal</span> Animation
                </h2>
                <p className="text-text-muted text-center mb-12 max-w-2xl mx-auto">
                    Elements below will animate into view as you scroll down
                </p>

                <div className="space-y-8">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="reveal-item glass-card p-12"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Zap size={32} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black mb-2">
                                        Scroll Reveal Item {i}
                                    </h3>
                                    <p className="text-text-dim">
                                        This element animates when it enters the viewport
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Animation Stats */}
            <div className="glass-card p-12 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-5xl font-black mb-2 shimmer-text">20+</div>
                        <div className="text-xs font-black uppercase tracking-widest text-text-dim">
                            Animation Types
                        </div>
                    </div>
                    <div>
                        <div className="text-5xl font-black mb-2 shimmer-text">60fps</div>
                        <div className="text-xs font-black uppercase tracking-widest text-text-dim">
                            Performance
                        </div>
                    </div>
                    <div>
                        <div className="text-5xl font-black mb-2 shimmer-text">GPU</div>
                        <div className="text-xs font-black uppercase tracking-widest text-text-dim">
                            Accelerated
                        </div>
                    </div>
                    <div>
                        <div className="text-5xl font-black mb-2 shimmer-text">∞</div>
                        <div className="text-xs font-black uppercase tracking-widest text-text-dim">
                            Possibilities
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimationShowcase;
