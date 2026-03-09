import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get dynamic parameters
  const name = searchParams.get('name') || 'Traveler';
  const sunSign = searchParams.get('sunSign') || 'Aries';
  const harmonyIndex = searchParams.get('harmonyIndex') || '75';
  const element = searchParams.get('element') || 'Fire';

  // Sign emoji mapping
  const signEmojis: Record<string, string> = {
    aries: '\u2648',
    taurus: '\u2649',
    gemini: '\u264A',
    cancer: '\u264B',
    leo: '\u264C',
    virgo: '\u264D',
    libra: '\u264E',
    scorpio: '\u264F',
    sagittarius: '\u2650',
    capricorn: '\u2651',
    aquarius: '\u2652',
    pisces: '\u2653',
  };

  // Element colors
  const elementColors: Record<string, string> = {
    wood: '#22C55E',
    fire: '#EF4444',
    earth: '#A16207',
    metal: '#6B7280',
    water: '#3B82F6',
  };

  const signEmoji = signEmojis[sunSign.toLowerCase()] || '\u2728';
  const accentColor = elementColors[element.toLowerCase()] || '#C9A46A';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0E1B33 0%, #1a2c4e 50%, #0E1B33 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, #8F7AD130 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#C9A46A',
              boxShadow: '0 0 20px #C9A46A',
            }}
          />
          <span
            style={{
              fontSize: '28px',
              fontWeight: '300',
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            ASTRO
          </span>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#C9A46A',
            }}
          />
          <span
            style={{
              fontSize: '28px',
              fontWeight: '300',
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            CHARACTER
          </span>
        </div>

        {/* Main Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 64px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Sign Emoji */}
          <div
            style={{
              fontSize: '80px',
              marginBottom: '24px',
            }}
          >
            {signEmoji}
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {name}
          </div>

          {/* Sun Sign */}
          <div
            style={{
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '32px',
              textTransform: 'capitalize',
            }}
          >
            {sunSign} Sun
          </div>

          {/* Harmony Index */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 48px',
              background: `linear-gradient(135deg, ${accentColor}40, #8F7AD140)`,
              borderRadius: '24px',
              border: `2px solid ${accentColor}60`,
            }}
          >
            <div
              style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                marginBottom: '8px',
              }}
            >
              Harmony Index
            </div>
            <div
              style={{
                fontSize: '64px',
                fontWeight: '800',
                background: `linear-gradient(135deg, #C9A46A, #8F7AD1)`,
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {harmonyIndex}%
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          <span>Entdecke dein kosmisches Profil</span>
          <span style={{ color: '#C9A46A' }}>astrocharacter.de</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
