'use client'
import { IconDropletPlus, IconHome, IconUserSquareRounded } from '@tabler/icons-react'
import Link from 'next/link'
import React from 'react'

function Nav() {
    const [activeTab, setActiveTab] = React.useState<string>('home');

    return (
        <div className="dock md:hidden bg-primary text-white">
            <Link href="/" onClick={()=>setActiveTab('home')} className={activeTab === 'home' ? 'dock-active' : ''}>
                <IconHome size={24} stroke={1.5} />
                <span className="dock-label">হোম</span>
            </Link>

            <Link href={'/request-blood'} onClick={()=>setActiveTab('request-blood')} className={activeTab === 'request-blood' ? 'dock-active' : ''}>
                <IconDropletPlus/>
                <span className="dock-label">ব্লাড রিকুয়েস্ট</span>
            </Link>

            <Link href={'/profile'} onClick={()=>setActiveTab('profile')} className={activeTab === 'profile' ? 'dock-active' : ''}>
                <IconUserSquareRounded/>
                <span className="dock-label">প্রোফাইল</span>
            </Link>
        </div>
    )
}

export default Nav