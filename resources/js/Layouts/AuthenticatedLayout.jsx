import Dropdown from '@/Components/Dropdown';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Moon, Sun} from 'lucide-react'


export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    
    // 🔹 STATE BARU UNTUK DARK MODE
    const [darkMode, setDarkMode] = useState(false);

    // 🔹 EFEK: Cek localStorage saat pertama kali load
    useEffect(() => {
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
            setDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setDarkMode(false);
        }
    }, []);

    // 🔹 FUNGSI TOGGLE
    const toggleTheme = () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setDarkMode(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            {/* Navbar Utama */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 transition-colors duration-300">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        
                        {/* Bagian Kiri: Logo & Navigasi Desktop */}
                        <div className="flex">
                            {/* Logo Image + Branding Text */}
                            <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <img 
                                    src="/beraksi-logo.webp" 
                                    alt="Logo Beraksi" 
                                    className="h-9 w-auto drop-shadow-sm p-1" 
                                />
                                <span className="font-bold text-xl tracking-tight text-gray-800 dark:text-white hidden sm:block">
                                    SIMONREDI
                                </span>
                            </Link>
                        </div>

                        {/* Bagian Kanan: User Dropdown & Toggle Dark Mode */}
                        <div className="hidden sm:flex sm:items-center sm:ms-6">
                            
                            {/* 🔹 TOMBOL TOGGLE DARK MODE */}
                            <button 
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-50 focus:outline-none transition-colors mr-3"
                                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {darkMode ? (
                                    <Sun className="h-5 w-5 fill-current text-orange-500" />
                                ) : (
                                    <Moon className="h-5 w-5 fill-current text-gray-500" />
                                )}
                            </button>

                            {/* User Dropdown */}
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition ease-in-out duration-150 shadow-sm"
                                            >
                                                {user.name}
                                                <svg className="-me-0.5 ms-2 h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Tombol Hamburger (Mobile) */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-500 dark:focus:text-gray-400 transition duration-150 ease-in-out"
                            >
                                <svg className="h-6 w-6 stroke-current" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="none" viewBox="0 0 24 24">
                                    {!showingNavigationDropdown ? (
                                        <>
                                            <path d="M4 6h16M4 12h16M4 18h16" />
                                        </>
                                    ) : (
                                        <>
                                            <path d="M6 18L18 6M6 6l12 12" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Menu Mobile (Responsive) */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg absolute w-full left-0 z-50'}>
                    {/* Logo di Mobile Menu */}
                    <div className="px-4 pt-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <Link href="/" className="flex items-center gap-2 mb-2">
                            <img src="/beraksi-logo.webp" alt="Logo Beraksi" className="h-8 w-auto p-1 rounded-lg" />
                            <span className="font-bold text-lg text-gray-800 dark:text-white">SIMONREDI</span>
                        </Link>
                    </div>

                    {/* Navigasi Mobile */}
                    <div className="pt-2 pb-3 space-y-1">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Dashboard
                        </ResponsiveNavLink>
                    </div>

                    {/* Profil User & Toggle di Mobile Menu */}
                    <div className="pt-4 pb-1 border-t border-gray-200 dark:border-gray-700">
                        <div className="px-4 flex justify-between items-center mb-3">
                            <div>
                                <div className="font-medium text-base text-gray-800 dark:text-gray-200">{user.name}</div>
                                <div className="font-medium text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                            
                            {/* 🔹 TOGGLE DI MOBILE */}
                            <button 
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {darkMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-1.37 2.13 6.001 6.001 0 0 1-8.5-8.5A9.04 9.04 0 0 0 12 3z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M12.002 3.002a9.75 9.75 0 0 0-1.254 19.408 6.001 6.001 0 0 1-2.13-1.37A9.001 9.001 0 0 0 12.002 3.002z" /></svg>
                                )}
                            </button>
                        </div>

                        <div className="space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header Halaman (Opsional) */}
            {header && (
                <header className="bg-white dark:bg-gray-800 shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Konten Utama */}
            <main>{children}</main>
        </div>
    );
}