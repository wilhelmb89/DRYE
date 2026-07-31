# Apply DRYE Mechanics Gallery video feature
$ErrorActionPreference = 'Stop'
if (-not (Test-Path 'sections') -or -not (Test-Path 'assets')) {
  Write-Host 'FEL: Kor skriptet fran DRYE-projektmappen.' -ForegroundColor Red; exit 1
}

$liquid = @'
{{ 'drye-mechanics-identification-gallery.css' | asset_url | stylesheet_tag }}

<section class="dryeNEW-section mech-gallery" id="gallery-{{ section.id }}" data-section-id="{{ section.id }}" data-drye-section data-section-index="15" data-section-name="field_gallery">  
  <div class="dryeNEW-container">
    <div class="mech-gallery__intro">
      {% if section.settings.eyebrow != blank %}
        <span class="dryeNEW-micro mech-gallery__eyebrow">
          {{ section.settings.eyebrow }}
        </span>
      {% endif %}

      {% if section.settings.heading != blank %}
        <h2 class="dryeNEW-h2 mech-gallery__heading">
          {{ section.settings.heading }}
        </h2>
      {% endif %}

      {% if section.settings.body != blank %}
        <div class="dryeNEW-body mech-gallery__sub">
          {{ section.settings.body }}
        </div>
      {% endif %}
    </div>

    <div class="mech-gallery__strip-wrap">
      <div class="mech-gallery__nav" aria-label="Gallery navigation">
        <button
          type="button"
          class="mech-gallery__nav-btn mech-gallery__nav-btn--prev is-disabled"
          data-gallery-prev
          aria-label="Previous panels"
        >
          &larr;
        </button>

        <button
          type="button"
          class="mech-gallery__nav-btn mech-gallery__nav-btn--next"
          data-gallery-next
          aria-label="Next panels"
        >
          &rarr;
        </button>
      </div>

      <div class="mech-gallery__strip" data-gallery-strip>
        {% for block in section.blocks %}
          <article class="mech-gallery__panel" {{ block.shopify_attributes }}>
            <div
              class="mech-gallery__img{% if block.settings.video_url != blank %} mech-gallery__img--video{% endif %}"
              {% if block.settings.video_url != blank %}data-mg-video="{{ block.settings.video_url.id }}"{% endif %}
            >
              {% if block.settings.image != blank %}
                {{
                  block.settings.image
                  | image_url: width: 1200
                  | image_tag:
                    class: 'mech-gallery__img-el',
                    loading: 'lazy',
                    sizes: '(min-width: 960px) 33vw, 82vw',
                    alt: block.settings.image_alt
                }}
              {% elsif block.settings.video_url != blank %}
                <img
                  class="mech-gallery__img-el"
                  src="https://i.ytimg.com/vi/{{ block.settings.video_url.id }}/hqdefault.jpg"
                  alt="{{ block.settings.image_alt }}"
                  loading="lazy"
                  width="480"
                  height="360"
                >
              {% else %}
                <div class="mech-gallery__img-placeholder"></div>
              {% endif %}

              <div class="mech-gallery__img-overlay" aria-hidden="true"></div>

              {% if block.settings.label != blank %}
                <div class="mech-gallery__img-lbl">
                  {{ block.settings.label }}
                </div>
              {% endif %}

              {% if block.settings.video_url != blank %}
                <button
                  type="button"
                  class="mech-gallery__play"
                  aria-label="{{ block.settings.video_play_label | default: 'Play video' }}"
                >
                  {% render 'icon-play' %}
                </button>
              {% endif %}
            </div>

            {% if block.settings.quote != blank or block.settings.source != blank %}
              <div class="mech-gallery__quote">
                {% if block.settings.quote != blank %}
                  <p class="dryeNEW-body--sm mech-gallery__quote-text">
                    {{ block.settings.quote }}
                  </p>
                {% endif %}

                {% if block.settings.source != blank %}
                  <p class="dryeNEW-body--caption mech-gallery__quote-src">
                    {{ block.settings.source }}
                  </p>
                {% endif %}
              </div>
            {% endif %}
          </article>
        {% endfor %}
      </div>

      <div class="dryeNEW-micro mech-gallery__swipe-hint" data-gallery-swipe-hint aria-hidden="true">
        {{ section.settings.swipe_label }}
      </div>

      <div class="mech-gallery__fade" aria-hidden="true"></div>
    </div>
  </div>
</section>

<script>
  (() => {
    const section = document.getElementById('gallery-{{ section.id }}');
    if (!section) return;

    section.addEventListener('click', (e) => {
      const btn = e.target.closest('.mech-gallery__play');
      if (!btn) return;

      const box = btn.closest('[data-mg-video]');
      if (!box) return;

      const id = box.getAttribute('data-mg-video');
      if (!id) return;

      const frame = document.createElement('div');
      frame.className = 'mech-gallery__video-frame';
      frame.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' +
        encodeURIComponent(id) +
        '?autoplay=1&rel=0&playsinline=1" title="Video" frameborder="0" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
        'allowfullscreen></iframe>';

      box.appendChild(frame);
    });

    const strip = section.querySelector('[data-gallery-strip]');
    const hint = section.querySelector('[data-gallery-swipe-hint]');
    const prevBtn = section.querySelector('[data-gallery-prev]');
    const nextBtn = section.querySelector('[data-gallery-next]');

    if (!strip) return;

    const desktopMq = window.matchMedia('(min-width: 960px)');
    let hasInteracted = false;

    const getScrollAmount = () => {
      const firstPanel = strip.querySelector('.mech-gallery__panel');
      if (!firstPanel) return strip.clientWidth * 0.8;

      const styles = window.getComputedStyle(strip);
      const gap = parseFloat(styles.columnGap || styles.gap) || 0;

      return firstPanel.getBoundingClientRect().width + gap;
    };

    const updateButtons = () => {
      if (!prevBtn || !nextBtn) return;

      const maxScroll = strip.scrollWidth - strip.clientWidth;
      const current = strip.scrollLeft;

      prevBtn.classList.toggle('is-disabled', current <= 8);
      nextBtn.classList.toggle('is-disabled', current >= maxScroll - 8);
    };

    const updateHint = () => {
      if (!hint) return;

      if (desktopMq.matches) {
        hint.classList.add('is-hidden');
        return;
      }

      const maxScroll = strip.scrollWidth - strip.clientWidth;

      if (maxScroll <= 8 || strip.scrollLeft > 16 || hasInteracted) {
        hint.classList.add('is-hidden');
      } else {
        hint.classList.remove('is-hidden');
      }
    };

    const hideHintOnInteraction = () => {
      if (desktopMq.matches || !hint || hasInteracted) return;

      hasInteracted = true;
      hint.classList.add('is-hidden');
    };

    const scrollByAmount = (direction) => {
      strip.scrollBy({
        left: getScrollAmount() * direction,
        behavior: 'smooth'
      });
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => scrollByAmount(-1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => scrollByAmount(1));
    }

    strip.addEventListener('scroll', () => {
      updateHint();
      updateButtons();
    }, { passive: true });

    strip.addEventListener('touchstart', hideHintOnInteraction, { passive: true });
    strip.addEventListener('pointerdown', hideHintOnInteraction, { passive: true });

    window.addEventListener('resize', () => {
      updateHint();
      updateButtons();
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTimeout(() => {
        if (strip.scrollWidth <= strip.clientWidth) return;

        strip.scrollBy({ left: 18, behavior: 'smooth' });

        setTimeout(() => {
          strip.scrollBy({ left: -18, behavior: 'smooth' });
        }, 400);
      }, 700);
    }

    updateHint();
    updateButtons();
  })();
</script>

{% schema %}
{
  "name": "DRYE Mechanics Gallery",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "text",
      "id": "eyebrow",
      "label": "Eyebrow",
      "default": "Different shops. Same shift."
    },
    {
      "type": "html",
      "id": "heading",
      "label": "Heading",
      "default": "Used inside gloves <em class=\"dryeNEW-em\">every day.</em>"
    },
    {
      "type": "textarea",
      "id": "body",
      "label": "Body",
      "default": "Mechanics, construction workers, forestry workers and painters. Different jobs. Same problem inside the glove."
    },
    {
      "type": "text",
      "id": "swipe_label",
      "label": "Swipe hint label",
      "default": "Swipe"
    }
  ],
  "blocks": [
    {
      "type": "panel",
      "name": "Panel",
      "settings": [
        {
          "type": "image_picker",
          "id": "image",
          "label": "Image"
        },
        {
          "type": "text",
          "id": "image_alt",
          "label": "Image alt text",
          "default": "Worker wearing DRYE glove liners"
        },
        {
          "type": "header",
          "content": "Video (optional)"
        },
        {
          "type": "video_url",
          "id": "video_url",
          "label": "YouTube link",
          "accept": ["youtube"],
          "info": "Paste a YouTube link to turn this panel into a clickable video. A play button appears on the image — visitors click it to watch right here."
        },
        {
          "type": "text",
          "id": "video_play_label",
          "label": "Play button label (accessibility)",
          "default": "Play video"
        },
        {
          "type": "text",
          "id": "label",
          "label": "Top label",
          "default": "Automotive"
        },
        {
          "type": "textarea",
          "id": "quote",
          "label": "Short quote",
          "default": "\"Hands are just less beat up now.\""
        },
        {
          "type": "text",
          "id": "source",
          "label": "Source",
          "default": "Automotive mechanic"
        }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [
    {
      "name": "DRYE Mechanics Gallery",
      "blocks": [
        {
          "type": "panel",
          "settings": {
            "label": "Forestry",
            "quote": "\"They hold up. That’s what matters.\"",
            "source": "Forest worker"
          }
        },
        {
          "type": "panel",
          "settings": {
            "label": "Automotive",
            "quote": "\"Hands are just less beat up now.\"",
            "source": "Automotive mechanic"
          }
        },
        {
          "type": "panel",
          "settings": {
            "label": "Construction",
            "quote": "\"Usually my hands crack every winter.\"",
            "source": "Construction worker"
          }
        }
      ]
    }
  ]
}
{% endschema %}
'@

$css = @'
/* ==========================================================================
   DRYE Mechanics — Field Use Gallery
   ========================================================================== */

.mech-gallery {
  background: var(--bg);
  border-bottom: var(--border-base);
}

.mech-gallery__intro {
  max-width: 700px;
  margin-bottom: var(--space-40);
}

.mech-gallery__eyebrow {
  color: var(--sage);
}

.mech-gallery__heading {
  max-width: 760px;
  margin-bottom: var(--space-12);
  color: var(--deep);
}

.mech-gallery__heading .dryeNEW-em {
  display: block;
  margin-top: var(--space-2);
  color: var(--sage);
}

.mech-gallery__sub {
  max-width: 560px;
  color: var(--muted);
}

.mech-gallery__strip-wrap {
  position: relative;
  padding-bottom: var(--space-56);
}

.mech-gallery__strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 82vw;
  gap: var(--space-2);
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  background: var(--border);
  border-top: var(--border-base);
  border-bottom: var(--border-base);
}

.mech-gallery__strip::-webkit-scrollbar {
  display: none;
}

.mech-gallery__panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: 0;
  background: var(--bg);
  scroll-snap-align: start;
}

.mech-gallery__img {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: var(--bg-soft);
}

.mech-gallery__img-el,
.mech-gallery__img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.92) brightness(0.98) contrast(1);
}

.mech-gallery__img--video {
  cursor: pointer;
}

.mech-gallery__play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(15, 34, 48, 0.78);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: 0 8px 24px rgba(15, 34, 48, 0.28);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.mech-gallery__play svg {
  width: 20px;
  height: 20px;
  margin-left: 3px;
  fill: #fff;
}

.mech-gallery__img--video:hover .mech-gallery__play,
.mech-gallery__play:focus-visible {
  background: var(--emerald, #0d9488);
  transform: translate(-50%, -50%) scale(1.06);
}

.mech-gallery__video-frame {
  position: absolute;
  inset: 0;
  z-index: 4;
  width: 100%;
  height: 100%;
  background: #000;
}

.mech-gallery__video-frame iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.mech-gallery__img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    var(--bg-soft) 0%,
    var(--border) 100%
  );
}

.mech-gallery__img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(10, 22, 33, 0.02) 0%,
    rgba(10, 22, 33, 0.08) 58%,
    rgba(10, 22, 33, 0.32) 100%
  );
}

.mech-gallery__img-lbl {
  position: absolute;
  top: var(--space-14);
  left: var(--space-14);
  padding: var(--space-5) var(--space-9);
  color: var(--white-100);
  background: rgba(10, 22, 33, 0.32);
  backdrop-filter: blur(4px);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: var(--ls-micro);
  font-size: var(--fs-micro-2);
  font-weight: var(--fw-semibold);
  line-height: 1.2;
}

.mech-gallery__quote {
  min-height: 128px;
  padding: var(--space-14) var(--space-14) var(--space-18);
  border-left: var(--border-base);
}

.mech-gallery__quote-text {
  max-width: 92%;
  margin-bottom: var(--space-8);
  color: var(--deep);
  font-family: var(--font-editorial);
  font-style: italic;
  line-height: var(--lh-body-tight);
}

.mech-gallery__quote-src {
  color: var(--caption);
}

.mech-gallery__swipe-hint {
  position: absolute;
  right: var(--page-pad);
  bottom: var(--space-18);
  display: flex;
  align-items: center;
  gap: var(--space-6);
  margin-bottom: 0;
  color: var(--caption);
  pointer-events: none;
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity var(--dur-sticky) var(--ease-standard),
    transform var(--dur-sticky) var(--ease-standard);
}

.mech-gallery__swipe-hint::after {
  content: '→';
  animation: mech-gallery-swipe 1.8s ease-in-out infinite;
}

.mech-gallery__swipe-hint.is-hidden {
  opacity: 0;
  transform: translateX(var(--space-6));
}

@keyframes mech-gallery-swipe {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0.6;
  }

  50% {
    transform: translateX(var(--space-4));
    opacity: 1;
  }
}

.mech-gallery__fade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: var(--space-56);
  width: 56px;
  pointer-events: none;
  background: linear-gradient(
    270deg,
    var(--bg) 0%,
    rgba(255, 255, 255, 0) 100%
  );
}

.mech-gallery__nav {
  display: none;
}

.mech-gallery__nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--bg);
  border: var(--border-base);
  color: var(--deep);
  cursor: pointer;
  transition:
    opacity var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard);
}

.mech-gallery__nav-btn:hover {
  border-color: var(--sage-020);
  transform: translateY(-1px);
}

.mech-gallery__nav-btn.is-disabled {
  opacity: 0.35;
  pointer-events: none;
}

@media (min-width: 600px) {
  .mech-gallery__strip {
    grid-auto-columns: minmax(300px, 42vw);
  }
}

@media (min-width: 960px) {
  .mech-gallery__strip-wrap {
    padding-bottom: 0;
  }

  .mech-gallery__strip {
    grid-auto-columns: calc((100% - (var(--space-2) * 2)) / 3);
    overflow-x: auto;
    border-left: var(--border-base);
    border-right: var(--border-base);
  }

  .mech-gallery__swipe-hint {
    display: none;
  }

  .mech-gallery__fade {
    display: block;
    bottom: 0;
  }

  .mech-gallery__nav {
    position: absolute;
    top: -56px;
    right: 0;
    display: flex;
    gap: var(--space-8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mech-gallery__strip,
  .mech-gallery__nav-btn,
  .mech-gallery__swipe-hint {
    scroll-behavior: auto;
    transition: none;
    animation: none;
  }

  .mech-gallery__swipe-hint::after {
    animation: none;
  }
}
'@

$utf8 = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'sections/drye-mechanics-identification-gallery.liquid'), $liquid + "`n", $utf8)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'assets/drye-mechanics-identification-gallery.css'), $css + "`n", $utf8)

$ok1 = Select-String -Path 'sections/drye-mechanics-identification-gallery.liquid' -Pattern 'video_url' -Quiet
$ok2 = Select-String -Path 'assets/drye-mechanics-identification-gallery.css' -Pattern 'mech-gallery__play' -Quiet
if ($ok1 -and $ok2) {
  Write-Host ''
  Write-Host 'KLART! Mechanics Gallery har nu videostod.' -ForegroundColor Green
} else { Write-Host 'FEL: verifiering misslyckades.' -ForegroundColor Red }
