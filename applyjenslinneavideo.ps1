# Apply DRYE Jens + Linnea YouTube video feature
# Kor detta fran DRYE-projektmappen:  .\apply-jens-linnea-video.ps1
$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'sections') -or -not (Test-Path 'assets')) {
  Write-Host 'FEL: Kor skriptet fran DRYE-projektmappen (dar mapparna sections och assets finns).' -ForegroundColor Red
  exit 1
}

$liquid = @'

{{ 'jens-linnea-section.css' | asset_url | stylesheet_tag }}

<section
  class="dryeNEW-section jens-linnea"
  id="jens-linnea-{{ section.id }}"
  data-section-id="{{ section.id }}"
  data-drye-section
  data-section-index="14"
  data-section-name="case_studies"
>
  <div class="dryeNEW-container">
    <div class="jens-linnea__header dryeNEW-reveal">
      {% if section.settings.micro_text != blank %}
        <span class="dryeNEW-micro jens-linnea__eyebrow">
          {{ section.settings.micro_text }}
        </span>
      {% endif %}

      {% if section.settings.heading != blank %}
        <h2 class="dryeNEW-h2 jens-linnea__heading">
          {{ section.settings.heading }}
        </h2>
      {% endif %}

      {% if section.settings.subheading != blank %}
        <div class="dryeNEW-body jens-linnea__subheading">
          <p>{{ section.settings.subheading }}</p>
        </div>
      {% endif %}
    </div>

    <div class="jens-linnea__swipe-wrap">
      <div class="jens-linnea__grid">
        {% for block in section.blocks %}
          <article
            class="jens-linnea__story dryeNEW-reveal {% if forloop.index == 1 %}dryeNEW-rd1{% elsif forloop.index == 2 %}dryeNEW-rd2{% endif %}"
            {{ block.shopify_attributes }}
          >
            <div
              class="jens-linnea__image-wrap{% if block.settings.video_url != blank %} jens-linnea__image-wrap--video{% endif %}"
              {% if block.settings.video_url != blank %}data-jl-video="{{ block.settings.video_url.id }}"{% endif %}
            >
              {% if block.settings.image != blank %}
                {{
                  block.settings.image
                  | image_url: width: 1200
                  | image_tag:
                    class: 'jens-linnea__image',
                    alt: block.settings.image_alt,
                    loading: 'lazy'
                }}
              {% elsif block.settings.video_url != blank %}
                <img
                  class="jens-linnea__image"
                  src="https://i.ytimg.com/vi/{{ block.settings.video_url.id }}/hqdefault.jpg"
                  alt="{{ block.settings.image_alt }}"
                  loading="lazy"
                  width="480"
                  height="360"
                >
              {% endif %}

              {% if block.settings.video_url != blank %}
                <button
                  type="button"
                  class="jens-linnea__play"
                  aria-label="{{ block.settings.video_play_label | default: 'Play video' }}"
                >
                  {% render 'icon-play' %}
                </button>
              {% endif %}
            </div>

            {% if block.settings.pill_text != blank %}
              <span class="dryeNEW-micro jens-linnea__pill">
                {{ block.settings.pill_text }}
              </span>
            {% endif %}

            {% if block.settings.before_label != blank %}
              <span class="dryeNEW-micro jens-linnea__label jens-linnea__label--before">
                {{ block.settings.before_label }}
              </span>
            {% endif %}

            {% if block.settings.before_text != blank %}
              <div class="dryeNEW-body--sm jens-linnea__before-text">
                <p>{{ block.settings.before_text }}</p>
              </div>
            {% endif %}

            {% if block.settings.after_label != blank %}
              <span class="dryeNEW-micro jens-linnea__label jens-linnea__label--after">
                {{ block.settings.after_label }}
              </span>
            {% endif %}

            {% if block.settings.after_text != blank %}
              <div class="dryeNEW-body--lg dryeNEW-editorial jens-linnea__after-text">
                <p>{{ block.settings.after_text }}</p>
              </div>
            {% endif %}

            <div class="dryeNEW-body--caption jens-linnea__attr">
              {% if block.settings.name != blank %}
                <span class="jens-linnea__attr-name">{{ block.settings.name }}</span>
              {% endif %}

              {% if block.settings.name != blank and block.settings.role != blank %}
                <span class="jens-linnea__attr-sep">·</span>
              {% endif %}

              {% if block.settings.role != blank %}
                <span class="jens-linnea__attr-role">{{ block.settings.role }}</span>
              {% endif %}
            </div>

            {% if block.settings.read_more_text != blank %}
              <a href="{{ block.settings.read_more_url }}" class="dryeNEW-link jens-linnea__read-more">
                {{ block.settings.read_more_text }}
              </a>
            {% endif %}
          </article>
        {% endfor %}
      </div>

      {% if section.blocks.size > 1 %}
        <div class="jens-linnea__swipe-hint" aria-hidden="true">
          {{ section.settings.swipe_label }}
        </div>

        <div class="jens-linnea__dots" aria-hidden="true">
          {% for block in section.blocks %}
            <span class="jens-linnea__dot {% if forloop.first %}is-active{% endif %}"></span>
          {% endfor %}
        </div>
      {% endif %}
    </div>
  </div>
</section>

<script>
  (function () {
    var root = document.getElementById('jens-linnea-{{ section.id }}');
    if (!root || root.dataset.jlVideoInit) return;
    root.dataset.jlVideoInit = '1';

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.jens-linnea__play');
      if (!btn) return;

      var wrap = btn.closest('[data-jl-video]');
      if (!wrap) return;

      var id = wrap.getAttribute('data-jl-video');
      if (!id) return;

      var frame = document.createElement('div');
      frame.className = 'jens-linnea__video-frame';
      frame.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' +
        encodeURIComponent(id) +
        '?autoplay=1&rel=0&playsinline=1" title="Interview video" frameborder="0" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
        'allowfullscreen></iframe>';

      wrap.innerHTML = '';
      wrap.appendChild(frame);
    });
  })();
</script>

{% schema %}
{
  "name": "Jens + Linnea",
  "tag": "section",
  "class": "shopify-section--jens-linnea",
  "settings": [
    {
      "type": "text",
      "id": "micro_text",
      "label": "Micro text",
      "default": "Real users"
    },
    {
      "type": "html",
      "id": "heading",
      "label": "Heading",
      "default": "This is what changes."
    },
    {
      "type": "textarea",
      "id": "subheading",
      "label": "Subheading",
      "default": "Neither found the answer in a new material. What changed was the environment inside the glove."
    },
    {
      "type": "text",
      "id": "swipe_label",
      "label": "Swipe pill label",
      "default": "Swipe"
    }
  ],
  "blocks": [
    {
      "type": "story",
      "name": "Story",
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
          "default": "Story image"
        },
        {
          "type": "header",
          "content": "Video (interview)"
        },
        {
          "type": "video_url",
          "id": "video_url",
          "label": "YouTube link",
          "accept": ["youtube"],
          "info": "Paste the YouTube link to the interview. A play button appears on the image — visitors click it to watch the interview right here."
        },
        {
          "type": "text",
          "id": "video_play_label",
          "label": "Play button label (accessibility)",
          "default": "Play interview"
        },
        {
          "type": "text",
          "id": "pill_text",
          "label": "Pill text",
          "default": "2 years later"
        },
        {
          "type": "text",
          "id": "before_label",
          "label": "Before label",
          "default": "Before"
        },
        {
          "type": "textarea",
          "id": "before_text",
          "label": "Before text",
          "default": "\"Some creams did nothing. My hands got worse every shift. Open wounds. I dealt with the damage for months.\""
        },
        {
          "type": "text",
          "id": "after_label",
          "label": "After label",
          "default": "After"
        },
        {
          "type": "textarea",
          "id": "after_text",
          "label": "After text",
          "default": "\"My hands are honestly normal now. Without a doubt, those liners gave my hands a real chance.\""
        },
        {
          "type": "text",
          "id": "name",
          "label": "Name",
          "default": "Jens Stålnacke"
        },
        {
          "type": "text",
          "id": "role",
          "label": "Role",
          "default": "Mine worker, LKAB Kiruna"
        },
        {
          "type": "url",
          "id": "read_more_url",
          "label": "Read more URL"
        },
        {
          "type": "text",
          "id": "read_more_text",
          "label": "Read more text",
          "default": "Read Jens' case →"
        }
      ]
    }
  ],
  "max_blocks": 2,
  "presets": [
    {
      "name": "Jens + Linnea",
      "blocks": [
        {
          "type": "story"
        },
        {
          "type": "story"
        }
      ]
    }
  ]
}
{% endschema %}
'@

$css = @'
.jens-linnea {
  background: var(--bg);
}

.jens-linnea__header {
  margin-bottom: var(--space-48);
}

.jens-linnea__heading {
  margin-bottom: var(--space-12);
  color: var(--deep);
}

.jens-linnea__heading em {
  font-family: var(--font-editorial);
  font-style: italic;
  font-weight: var(--fw-regular);
  color: var(--accent);
}

.jens-linnea__subheading {
  max-width: 480px;
  color: var(--muted);
}

.jens-linnea__subheading p {
  margin: 0;
}

.jens-linnea__swipe-wrap {
  position: relative;
  padding-bottom: var(--space-64);
}

.jens-linnea__grid {
  display: flex;
  gap: var(--grid-gap-20);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.jens-linnea__grid::-webkit-scrollbar {
  display: none;
}

.jens-linnea__story {
  display: flex;
  flex: 0 0 84%;
  flex-direction: column;
  scroll-snap-align: start;
}

.jens-linnea__image-wrap {
  width: 100%;
  overflow: hidden;
  margin-bottom: var(--space-20);
  background: var(--bg-soft);
}

.jens-linnea__image-wrap--video {
  position: relative;
  cursor: pointer;
}

.jens-linnea__play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
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

.jens-linnea__play svg {
  width: 22px;
  height: 22px;
  margin-left: 3px;
  fill: #fff;
}

.jens-linnea__image-wrap--video:hover .jens-linnea__play,
.jens-linnea__play:focus-visible {
  background: var(--emerald, #0d9488);
  transform: translate(-50%, -50%) scale(1.06);
}

.jens-linnea__video-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.jens-linnea__video-frame iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.jens-linnea__image {
  display: block;
  width: 100%;
  height: 260px;
  object-fit: cover;
  object-position: center 25%;
}

.jens-linnea__pill {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  margin-bottom: var(--space-14);
  padding: var(--space-3) var(--space-9);
  background: rgba(13, 148, 136, 0.07);
  border: 1px solid rgba(13, 148, 136, 0.18);
  color: var(--emerald);
}

.jens-linnea__label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-7);
  margin-bottom: var(--space-5);
}

.jens-linnea__label::before {
  content: "";
  width: 10px;
  height: 1px;
  flex-shrink: 0;
  background: currentColor;
}

.jens-linnea__label--before {
  color: var(--red);
}

.jens-linnea__label--after {
  color: var(--emerald);
}

.jens-linnea__before-text {
  margin-bottom: var(--space-18);
  padding-bottom: var(--space-18);
  border-bottom: var(--border-base);
  color: var(--muted);
}

.jens-linnea__before-text p {
  margin: 0;
  font-style: italic;
}

.jens-linnea__after-text {
  margin-bottom: var(--space-12);
  color: var(--deep);
}

.jens-linnea__after-text p {
  margin: 0;
}

.jens-linnea__attr {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-6);
  margin-bottom: var(--space-16);
  color: var(--caption);
}

.jens-linnea__attr-name {
  color: var(--muted);
  font-weight: var(--fw-semibold);
}

.jens-linnea__attr-sep {
  color: var(--caption);
}

.jens-linnea__attr-role {
  color: var(--caption);
}

.jens-linnea__read-more {
  align-self: flex-start;
  color: var(--sage);
}

.jens-linnea__read-more:hover {
  color: var(--deep);
}

.jens-linnea__swipe-hint {
  position: absolute;
  right: var(--space-16);
  bottom: var(--space-32);
  z-index: 5;

  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-8) var(--space-14);

  background: rgba(15, 34, 48, 0.82);
  backdrop-filter: blur(6px);
  color: var(--bg);

  pointer-events: none;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: var(--fs-micro-2);
  font-weight: var(--fw-semibold);
  line-height: 1;

  animation: jens-linnea-pill-pulse 2s infinite;
}

.jens-linnea__swipe-hint::after {
  content: "→";
  font-size: 12px;
  letter-spacing: 0;
  animation: jens-linnea-swipe 1.4s infinite;
}

.jens-linnea__dots {
  position: absolute;
  left: 50%;
  bottom: var(--space-10);
  transform: translateX(-50%);

  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-8);
}

.jens-linnea__dot {
  width: 6px;
  height: 6px;
  background: var(--border);
}

.jens-linnea__dot.is-active {
  width: 18px;
  background: var(--deep);
}

@keyframes jens-linnea-swipe {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0.75;
  }

  50% {
    transform: translateX(5px);
    opacity: 1;
  }
}

@keyframes jens-linnea-pill-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(15, 34, 48, 0.35);
  }

  50% {
    box-shadow: 0 0 0 6px rgba(15, 34, 48, 0);
  }
}

@media (min-width: 768px) {
  .jens-linnea__swipe-wrap {
    padding-bottom: 0;
  }

  .jens-linnea__swipe-hint,
  .jens-linnea__dots {
    display: none;
  }

  .jens-linnea__grid {
    display: grid;
    grid-template-columns: var(--grid-2-col-desktop);
    gap: var(--grid-gap-48);
    overflow: visible;
    scroll-snap-type: none;
  }

  .jens-linnea__story {
    flex: initial;
    scroll-snap-align: none;
  }

  .jens-linnea__image {
    height: 300px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .jens-linnea__grid {
    scroll-behavior: auto;
  }

  .jens-linnea__swipe-hint,
  .jens-linnea__swipe-hint::after {
    animation: none;
  }
}
'@

Set-Content -Path 'sections/jens-linnea-section.liquid' -Value $liquid -Encoding UTF8 -NoNewline
Add-Content -Path 'sections/jens-linnea-section.liquid' -Value "`n" -NoNewline
Set-Content -Path 'assets/jens-linnea-section.css' -Value $css -Encoding UTF8 -NoNewline
Add-Content -Path 'assets/jens-linnea-section.css' -Value "`n" -NoNewline

$ok1 = Select-String -Path 'sections/jens-linnea-section.liquid' -Pattern 'video_url' -Quiet
$ok2 = Select-String -Path 'assets/jens-linnea-section.css' -Pattern 'jens-linnea__play' -Quiet
if ($ok1 -and $ok2) {
  Write-Host '' 
  Write-Host 'KLART! Bada filerna ar skrivna och innehaller videofunktionen.' -ForegroundColor Green
  Write-Host 'Nasta steg - committa och pusha:' -ForegroundColor Cyan
  Write-Host '  git add sections/jens-linnea-section.liquid assets/jens-linnea-section.css'
  Write-Host '  git commit -m "Add YouTube interview video support to Jens + Linnea section"'
  Write-Host '  git push origin shopify-live'
} else {
  Write-Host 'FEL: Verifieringen misslyckades. Hor av dig.' -ForegroundColor Red
}
