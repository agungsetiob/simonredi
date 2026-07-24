import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />
            
            <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
                
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                    
                    <div className="relative z-10 text-center space-y-6 max-w-md mx-auto">
                        <img 
                            src="/beraksi-logo.webp" 
                            alt="Logo Beraksi" 
                            className="h-24 w-auto mx-auto mb-2 drop-shadow-lg p-3 rounded-xl" 
                        />
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md space-y-8">
                        
                        {/* Header Mobile */}
                        <div className="lg:hidden text-center mb-6">
                            <img src="/beraksi-logo.webp" alt="Logo Beraksi" className="h-14 w-auto mx-auto mb-2" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SIMONREDI</h1>
                        </div>

                        {/* Notifikasi Status */}
                        {status && (
                            <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 border-l-4 border-green-500 p-3 rounded-r-md">
                                {status}
                            </div>
                        )}

                        <h1 className="text-4xl font-extrabold text-dark dark:text-gray-300 tracking-tight text-center">SIMONREDI</h1>
                        <p className="text-blue-700 dark:text-gray-300 text-sm font-medium text-center">Sistem Monitoring Rekam Medis Elektronik</p>

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="email" value="Email" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2 cursor-pointer select-none">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Ingat saya</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        Lupa password?
                                    </Link>
                                )}
                            </div>

                            <PrimaryButton 
                                className="w-full flex justify-center py-2.5 px-4 border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200" 
                                disabled={processing}
                            >
                                {processing ? 'Memproses...' : 'Masuk'}
                            </PrimaryButton>
                        </form>

                        <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
                            &copy; {new Date().getFullYear()} SIMONREDI. RSUD dr. H. Andi Abdurrahman Noor
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}