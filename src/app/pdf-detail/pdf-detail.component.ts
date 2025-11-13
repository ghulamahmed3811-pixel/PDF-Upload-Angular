import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface PdfResource {
  id: number;
  title: string;
  description: string;
  author: string;
  pages: number;
  category: string;
  publishDate?: string;
  fileSize?: string;
  language?: string;
  detailedDescription?: string;
}

@Component({
  selector: 'app-pdf-detail',
  imports: [CommonModule],
  templateUrl: './pdf-detail.component.html',
  styleUrl: './pdf-detail.component.scss'
})
export class PdfDetailComponent implements OnInit {
  pdf: PdfResource | null = null;

  // Complete PDF data with detailed descriptions
  private pdfDatabase: PdfResource[] = [
    {
      id: 1,
      title: 'Angular Best Practices Guide',
      description: 'A comprehensive guide covering the best practices for building scalable Angular applications. Learn about component architecture, state management, and performance optimization.',
      author: 'John Developer',
      pages: 150,
      category: 'Web Development',
      publishDate: 'January 2024',
      fileSize: '4.5 MB',
      language: 'English',
      detailedDescription: `This comprehensive guide is designed for Angular developers who want to master best practices and build scalable, maintainable applications. 

Key Topics Covered:
• Component Architecture - Learn how to structure components for maximum reusability and maintainability
• State Management - Master NgRx, signals, and other state management patterns
• Performance Optimization - Implement lazy loading, change detection strategies, and optimization techniques
• Testing Strategies - Write comprehensive unit, integration, and e2e tests
• Code Organization - Follow industry-standard folder structures and naming conventions
• Security Best Practices - Protect your application from common vulnerabilities

This guide includes real-world examples, code snippets, and practical exercises to help you apply what you learn immediately. Whether you're building small applications or large enterprise systems, this guide will help you write better Angular code.`
    },
    {
      id: 2,
      title: 'TypeScript Advanced Patterns',
      description: 'Deep dive into advanced TypeScript patterns and techniques. Master generics, decorators, and type manipulation for professional development.',
      author: 'Sarah Code',
      pages: 200,
      category: 'Programming',
      publishDate: 'February 2024',
      fileSize: '5.2 MB',
      language: 'English',
      detailedDescription: `Unlock the full potential of TypeScript with this advanced guide to type-safe programming and sophisticated design patterns.

Advanced Topics:
• Generic Programming - Create flexible, reusable components with powerful type constraints
• Advanced Type Manipulation - Master utility types, conditional types, and mapped types
• Decorators - Implement cross-cutting concerns with elegant decorator patterns
• Type Guards and Narrowing - Write type-safe code with advanced type checking techniques
• Module Systems - Understand ESM, CommonJS, and how to structure large TypeScript projects
• Performance Considerations - Optimize compilation time and runtime performance

This book goes beyond basic TypeScript syntax to explore the language's most powerful features. You'll learn how to leverage the type system to catch errors at compile time, create self-documenting code, and build robust applications that scale.`
    },
    {
      id: 3,
      title: 'SCSS Styling Mastery',
      description: 'Learn modern CSS preprocessing with SCSS. Discover mixins, functions, and advanced styling techniques to create beautiful responsive designs.',
      author: 'Mike Styles',
      pages: 120,
      category: 'Design',
      publishDate: 'March 2024',
      fileSize: '3.8 MB',
      language: 'English',
      detailedDescription: `Transform your CSS workflow with SCSS and create maintainable, scalable stylesheets that power beautiful user interfaces.

What You'll Learn:
• SCSS Fundamentals - Variables, nesting, and partials for organized stylesheets
• Mixins and Functions - Create reusable styling patterns and utilities
• Advanced Selectors - Master parent selectors, placeholders, and extend
• Responsive Design - Build mobile-first, fluid layouts with modern techniques
• Color Functions - Manipulate colors programmatically for consistent theming
• Architecture Patterns - Implement BEM, SMACSS, or custom methodology
• Build Tools - Integrate SCSS into your development workflow

Complete with practical examples, this guide covers everything from basic SCSS concepts to advanced techniques used in production applications. Learn how to write CSS that's easier to maintain, more organized, and more powerful.`
    },
    {
      id: 4,
      title: 'Web Performance Optimization',
      description: 'Complete guide to optimizing web applications. Learn about lazy loading, code splitting, caching strategies, and performance monitoring tools.',
      author: 'Emma Performance',
      pages: 180,
      category: 'Web Development',
      publishDate: 'December 2023',
      fileSize: '6.1 MB',
      language: 'English',
      detailedDescription: `Make your web applications blazingly fast with proven performance optimization techniques and best practices.

Performance Topics:
• Loading Performance - Optimize initial load time with code splitting and lazy loading
• Runtime Performance - Improve responsiveness with efficient rendering strategies
• Network Optimization - Minimize bandwidth usage with compression and caching
• Image Optimization - Serve the right images at the right size with modern formats
• Core Web Vitals - Understand and improve LCP, FID, and CLS metrics
• Performance Monitoring - Set up real-user monitoring and synthetic testing
• Progressive Enhancement - Build fast experiences for all users and devices

This comprehensive guide combines theory with practice, showing you how to measure, analyze, and improve performance. You'll learn how to use Chrome DevTools, Lighthouse, and other tools to identify bottlenecks and implement solutions that make a real difference.`
    },
    {
      id: 5,
      title: 'Modern UI/UX Design Principles',
      description: 'Explore contemporary design principles and user experience patterns. Create intuitive interfaces that users love with proven design methodologies.',
      author: 'David Designer',
      pages: 160,
      category: 'Design',
      publishDate: 'November 2023',
      fileSize: '8.3 MB',
      language: 'English',
      detailedDescription: `Create exceptional user experiences with modern design principles, user research techniques, and interface design best practices.

Design Principles:
• User-Centered Design - Put users at the center of your design process
• Visual Hierarchy - Guide users' attention with effective layout and typography
• Color Theory - Choose colors that communicate and enhance usability
• Typography - Select and pair fonts that are both beautiful and functional
• Accessibility - Design inclusive experiences for all users
• Interaction Design - Create intuitive, delightful interactions
• Design Systems - Build consistent, scalable component libraries
• User Research - Conduct effective research to inform design decisions

This guide is packed with examples, case studies, and practical exercises. Learn from real-world projects and discover how to apply design thinking to solve complex problems. Whether you're designing mobile apps, web applications, or complex enterprise systems, you'll find valuable insights and actionable advice.`
    },
    {
      id: 6,
      title: 'API Design and Integration',
      description: 'Master RESTful API design, GraphQL, and service integration. Learn authentication, error handling, and building robust backend connections.',
      author: 'Lisa Backend',
      pages: 190,
      category: 'Backend',
      publishDate: 'October 2023',
      fileSize: '4.9 MB',
      language: 'English',
      detailedDescription: `Build robust, scalable APIs and integrate them seamlessly into your applications with this comprehensive guide to API design and integration.

Core Concepts:
• RESTful API Design - Follow REST principles and best practices
• GraphQL - Build flexible APIs with GraphQL queries and mutations
• API Authentication - Implement OAuth, JWT, and other auth patterns
• Error Handling - Design clear, consistent error responses
• API Documentation - Create comprehensive, developer-friendly docs
• Rate Limiting - Protect your APIs from abuse
• Versioning Strategies - Evolve your API without breaking clients
• Testing APIs - Write comprehensive API tests

Learn how to design APIs that are intuitive, consistent, and easy to use. This guide covers both REST and GraphQL, helping you choose the right approach for your use case. You'll also learn how to integrate third-party APIs, handle authentication securely, and build resilient applications that gracefully handle failures.`
    }
  ];

  private isBrowser = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.pdf = this.pdfDatabase.find(p => p.id === id) || null;
      
      // If not found in database, check if it's from uploaded PDFs (stored in localStorage)
      if (!this.pdf && this.isBrowser) {
        const uploadedPdfs = localStorage.getItem('uploadedPdfs');
        if (uploadedPdfs) {
          const pdfs = JSON.parse(uploadedPdfs);
          this.pdf = pdfs.find((p: PdfResource) => p.id === id) || null;
        }
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

