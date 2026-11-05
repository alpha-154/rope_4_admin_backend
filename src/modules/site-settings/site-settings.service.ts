import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { OrganizationService } from '../organization/organization.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import {
  SiteSettings,
  SiteSettingsDocument,
} from './entities/site-settings.entity';

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    @InjectModel(SiteSettings.name)
    private readonly settingsModel: Model<SiteSettingsDocument>,
    private readonly orgService: OrganizationService,
  ) {}

  private getDefaultSettings(
    orgId: mongoose.Types.ObjectId,
  ): Partial<SiteSettings> {
    return {
      organizationId: orgId,
      header: {
        logoUrl: '/images/rope4-logo.svg',
        logoText: 'Rope4',
        tagline: 'Outdoor Education & Adventure',
        announcement: {
          enabled: true,
          text: 'Registration Open for 2026 Alpine Expeditions & Summer Youth Camps!',
          linkUrl: '/programs',
          badge: 'New Season',
        },
        quickContact: {
          phone: '+880 1711 000 000',
          email: 'adventure@rope4.org',
          address: 'House 12, Road 4, Dhanmondi, Dhaka',
        },
        ctaButton: {
          label: 'Plan Adventure',
          url: '/programs',
          isVisible: true,
        },
        navItems: [
          {
            label: 'Choose Trek',
            href: '/programs',
            isMegaMenu: true,
            megaMenuCategories: [
              {
                title: 'Himalayan Treks',
                items: [
                  {
                    label: 'Kedarkantha Winter Trek',
                    href: '/programs/kedarkantha-snow-trek',
                    description:
                      '12,500 ft summit with 360-degree snow panorama',
                    badge: 'Bestseller',
                  },
                  {
                    label: 'Hampta Pass Crossing',
                    href: '/programs/hampta-pass',
                    description:
                      'Crossover trek from Kullu green valleys to Spiti desert',
                  },
                ],
              },
              {
                title: 'Outdoor Education',
                items: [
                  {
                    label: 'Basic Mountaineering Course (BMC)',
                    href: '/programs/basic-mountaineering-course',
                    description:
                      'Accredited technical alpine craft certification',
                    badge: 'Certified',
                  },
                  {
                    label: 'Wilderness Survival & First Aid',
                    href: '/programs/wilderness-first-aid',
                    description:
                      'Standard outdoor medical emergency preparedness',
                  },
                ],
              },
              {
                title: 'Domestic & Weekend',
                items: [
                  {
                    label: 'Keokradong Summit Adventure',
                    href: '/programs/keokradong-summit',
                    description:
                      'Bandarban highlands trek and camp under stars',
                  },
                  {
                    label: 'Saka Haphong Expedition',
                    href: '/programs/saka-haphong',
                    description:
                      'Challenging trail to highest peak of Bangladesh',
                  },
                ],
              },
            ],
          },
          {
            label: 'Courses',
            href: '/programs?category=course',
            isMegaMenu: false,
            children: [
              {
                label: 'Rock Climbing & Rappelling',
                href: '/programs?category=climbing',
              },
              {
                label: 'Leave No Trace (LNT) Trainer',
                href: '/programs?category=conservation',
              },
            ],
          },
          {
            label: 'Why Rope4',
            href: '/why-choose-us',
            isMegaMenu: false,
          },
          {
            label: 'Stories & News',
            href: '/news',
            isMegaMenu: false,
          },
          {
            label: 'FAQs',
            href: '/faqs',
            isMegaMenu: false,
          },
          {
            label: 'Contact',
            href: '/contact',
            isMegaMenu: false,
          },
        ],
      },
      footer: {
        aboutText:
          'Rope4 is a pioneering outdoor education, mountaineering, and experiential adventure organization dedicated to responsible wilderness exploration, alpine learning, and safety excellence worldwide.',
        copyright: `© ${new Date().getFullYear()} Rope4 Outdoor Education. All rights reserved.`,
        emergencyHotline: '+880 1800 ROPE4 (76734)',
        columns: [
          {
            title: 'Expeditions & Treks',
            links: [
              {
                label: 'Himalayan Expeditions',
                url: '/programs?category=himalayan',
              },
              { label: 'Monsoon Treks', url: '/programs?season=monsoon' },
              { label: 'Weekend Escapes', url: '/programs?category=weekend' },
              {
                label: 'Family & Youth Camps',
                url: '/programs?category=family',
              },
            ],
          },
          {
            title: 'Outdoor Learning',
            links: [
              {
                label: 'Mountaineering Certification',
                url: '/programs?category=course',
              },
              {
                label: 'Wilderness Medicine',
                url: '/programs?category=first-aid',
              },
              {
                label: 'Leave No Trace Principles',
                url: '/about/leave-no-trace',
              },
              { label: 'Equipment & Gear Guide', url: '/news?tag=gear' },
            ],
          },
          {
            title: 'About Rope4',
            links: [
              { label: 'Our Story & Philosophy', url: '/about' },
              { label: 'Expedition Leaders & Guides', url: '/about/team' },
              { label: 'Sustainability & Safety', url: '/about/safety' },
              { label: 'Reviews & Testimonials', url: '/reviews' },
            ],
          },
          {
            title: 'Support & Legal',
            links: [
              { label: 'Frequently Asked Questions', url: '/faqs' },
              {
                label: 'Cancellation & Refund Policy',
                url: '/policies/cancellation',
              },
              { label: 'Terms & Conditions', url: '/policies/terms' },
              { label: 'Privacy Policy', url: '/policies/privacy' },
            ],
          },
        ],
        socialLinks: [
          {
            platform: 'Facebook',
            url: 'https://facebook.com/rope4',
            icon: 'facebook',
          },
          {
            platform: 'Instagram',
            url: 'https://instagram.com/rope4',
            icon: 'instagram',
          },
          {
            platform: 'YouTube',
            url: 'https://youtube.com/@rope4',
            icon: 'youtube',
          },
          {
            platform: 'LinkedIn',
            url: 'https://linkedin.com/company/rope4',
            icon: 'linkedin',
          },
        ],
        bottomLinks: [
          { label: 'Site Map', url: '/sitemap' },
          { label: 'Safety Guidelines', url: '/safety' },
          { label: 'Brand Assets', url: '/brand' },
        ],
        badges: [
          {
            label: 'Certified Mountaineering Institute',
            imageUrl: '/images/badges/mountaineering-partner.svg',
            linkUrl: '/about/certifications',
          },
          {
            label: 'Leave No Trace Proud Partner',
            imageUrl: '/images/badges/leave-no-trace.svg',
            linkUrl: 'https://lnt.org',
          },
          {
            label: 'Eco Tourism Certified',
            imageUrl: '/images/badges/eco-tourism.svg',
          },
        ],
      },
    };
  }

  async getSettings(organizationId: string): Promise<SiteSettings> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    let settings = await this.settingsModel
      .findOne({ organizationId: orgObjId })
      .exec();

    if (!settings) {
      this.logger.log(
        `Seeding initial SiteSettings singleton for organization: ${organizationId}`,
      );
      const defaultData = this.getDefaultSettings(orgObjId);
      settings = await this.settingsModel.create(defaultData);
    }

    return settings;
  }

  async updateSettings(
    organizationId: string,
    dto: UpdateSiteSettingsDto,
  ): Promise<SiteSettings> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    let settings = await this.settingsModel
      .findOne({ organizationId: orgObjId })
      .exec();
    if (!settings) {
      const defaultData = this.getDefaultSettings(orgObjId);
      settings = await this.settingsModel.create({
        ...defaultData,
        ...dto,
      });
      return settings;
    }

    if (dto.header) {
      settings.header = {
        ...settings.header,
        ...dto.header,
      };
    }

    if (dto.footer) {
      settings.footer = {
        ...settings.footer,
        ...dto.footer,
      };
    }

    return settings.save();
  }

  async getPublicSettings(organizationId?: string): Promise<SiteSettings> {
    if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
      return this.getSettings(organizationId);
    }

    // Fall back to first active organization
    const defaultOrg = await this.orgService.findDefaultOrFirst();
    if (defaultOrg) {
      return this.getSettings(defaultOrg._id.toString());
    }

    // Fallback in-memory singleton
    return this.getDefaultSettings(
      new mongoose.Types.ObjectId('659fa421943d22001e749210'),
    ) as SiteSettings;
  }
}
