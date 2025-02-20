'use client';

import Contributions from '@/components/Contributions';
import CustomizePanel from '@/components/CustomizePanel';
import TechnologyInsights from '@/components/TechnologyInsights';
import TopRepositories from '@/components/TopRepositories';
import UserStats from '@/components/UserStats';
import { useResume } from '@/context/ResumeContext';
import { fetchGitHubData } from '@/lib/github-api';
import { Building2, Calendar, Link as LinkIcon, Mail, MapPin, Twitter } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function ResumePage() {
  const params = useParams();
  const username = params?.username as string;
  const { filters, setFilters, userData, setUserData } = useResume();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setUserData(null);
        
        const data = await fetchGitHubData(username);
        
        if (isMounted && data) {
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (isMounted) {
          setUserData(null);
        }
      }
    };

    if (username) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [username, setUserData]);

  const handleExportPDF = async () => {
    if (!resumeRef.current || isExporting) return;
    setIsExporting(true);
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Yazdırma modunu aktif et
      document.body.classList.add('print-mode');
      
      // Tüm elementleri yazdırma moduna hazırla
      const elements = resumeRef.current.getElementsByClassName('page-break-inside-avoid');
      Array.from(elements).forEach(el => {
        (el as HTMLElement).style.marginBottom = '15mm';
      });

      const opt = {
        margin: 15,
        filename: `github-resume-generator-${username}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true,
        },
        pagebreak: { mode: 'avoid-all' }
      };

      // PDF oluştur
      await html2pdf().from(resumeRef.current).set(opt).save();
      
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      // Yazdırma modunu kapat
      document.body.classList.remove('print-mode');
      
      // Margin düzeltmelerini geri al
      const elements = resumeRef.current?.getElementsByClassName('page-break-inside-avoid');
      Array.from(elements || []).forEach(el => {
        (el as HTMLElement).style.marginBottom = '';
      });
      
      setIsExporting(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-dark">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <div className="text-surface-600 dark:text-dark-secondary">
            Loading {username}'s profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sol Taraf - Filtreler */}
          <div className="order-2 md:order-1 md:w-80 no-print">
            <CustomizePanel />
          </div>

          {/* Sağ Taraf - CV İçeriği */}
          <div className="order-1 md:order-2 md:flex-1">
            <div 
              ref={resumeRef}
              className="cv-container"
              style={{ maxWidth: '210mm' }}
            >
              <div className="p-4 sm:p-6 md:p-8 lg:p-[12mm] min-h-screen md:min-h-[297mm]">
                {/* Profile Section */}
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 pb-6 
                                border-b border-surface-200 dark:border-dark">
                  {filters.showAvatar && (
                    <img
                      src={userData.avatar_url}
                      alt={userData.name || userData.login}
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full 
                               ring-2 ring-surface-200 dark:ring-dark"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-surface-900 dark:text-dark">
                      {userData.name || userData.login}
                    </h2>
                    <p className="text-surface-600 dark:text-dark-secondary">@{userData.login}</p>
                    
                    {filters.showBio && userData.bio && (
                      <p className="mt-2 text-surface-700 dark:text-dark-secondary">{userData.bio}</p>
                    )}
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {filters.showLocation && userData.location && (
                          <div className="flex items-center text-surface-600 dark:text-dark-secondary">
                            <MapPin size={16} className="mr-2 shrink-0" />
                            <span>{userData.location}</span>
                          </div>
                        )}
                        
                        {filters.showCompany && userData.company && (
                          <div className="flex items-center text-surface-600 dark:text-dark-secondary">
                            <Building2 size={16} className="mr-2 shrink-0" />
                            <span>{userData.company}</span>
                          </div>
                        )}
                        
                        {filters.showJoinedYear && (
                          <div className="flex items-center text-surface-600 dark:text-dark-secondary">
                            <Calendar size={16} className="mr-2 shrink-0" />
                            <span>Joined {new Date(userData.created_at).getFullYear()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {userData.social?.email && (
                          <div className="flex items-center text-surface-600 dark:text-dark-secondary">
                            <Mail size={16} className="mr-2 shrink-0" />
                            <a 
                              href={`mailto:${userData.social.email}`} 
                              className="hover:text-primary-600 dark:hover:text-primary-500 truncate"
                            >
                              {userData.social.email}
                            </a>
                          </div>
                        )}
                        
                        {userData.social?.blog && (
                          <div className="flex items-center text-surface-600 dark:text-dark-secondary">
                            <LinkIcon size={16} className="mr-2 shrink-0" />
                            <a 
                              href={userData.social.blog.startsWith('http') ? userData.social.blog : `https://${userData.social.blog}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary-600 dark:hover:text-primary-500 truncate"
                            >
                              {userData.social.blog}
                            </a>
                          </div>
                        )}
                        
                        {userData.social?.twitter_username && (
                          <div className="flex items-center text-surface-600 dark:text-dark-secondary">
                            <Twitter size={16} className="mr-2 shrink-0" />
                            <a 
                              href={userData.social.twitter_username}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary-600 dark:hover:text-primary-500 truncate"
                            >
                              {userData.social.twitter_username.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats & Repos */}
                <div className="space-y-8">
                  {filters.statsView.showPinned && (
                    <div className="page-break-inside-avoid">
                      <UserStats data={userData} />
                    </div>
                  )}
                  <div className="page-break-inside-avoid">
                    <TopRepositories data={userData} />
                  </div>
                  <div className="page-break-inside-avoid">
                    <Contributions data={userData} />
                  </div>
                </div>

                {/* Teknoloji Insights Bölümü */}
                <div className="mt-8 mb-8">
                  <TechnologyInsights repositories={userData.repositories} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 