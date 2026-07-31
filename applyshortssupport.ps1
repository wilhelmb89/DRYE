# Update YouTube field to accept Shorts/youtu.be/watch in both sections
$ErrorActionPreference = 'Stop'
if (-not (Test-Path 'sections')) { Write-Host 'FEL: Kor fran DRYE-mappen.' -ForegroundColor Red; exit 1 }

$jl = @'
﻿
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
          {%- assign jl_url = block.settings.video_url | strip -%}
          {%- assign jl_id = '' -%}
          {%- if jl_url != blank -%}
            {%- if jl_url contains 'shorts/' -%}
              {%- assign jl_id = jl_url | split: 'shorts/' | last | split: '?' | first | split: '/' | first -%}
            {%- elsif jl_url contains 'youtu.be/' -%}
              {%- assign jl_id = jl_url | split: 'youtu.be/' | last | split: '?' | first | split: '/' | first -%}
            {%- elsif jl_url contains 'embed/' -%}
              {%- assign jl_id = jl_url | split: 'embed/' | last | split: '?' | first | split: '/' | first -%}
            {%- elsif jl_url contains 'v=' -%}
              {%- assign jl_id = jl_url | split: 'v=' | last | split: '&' | first -%}
            {%- else -%}
              {%- assign jl_id = jl_url | split: '/' | last | split: '?' | first -%}
            {%- endif -%}
          {%- endif -%}
          <article
            class="jens-linnea__story dryeNEW-reveal {% if forloop.index == 1 %}dryeNEW-rd1{% elsif forloop.index == 2 %}dryeNEW-rd2{% endif %}"
            {{ block.shopify_attributes }}
          >
            <div
              class="jens-linnea__image-wrap{% if jl_id != blank %} jens-linnea__image-wrap--video{% endif %}"
              {% if jl_id != blank %}data-jl-video="{{ jl_id }}"{% endif %}
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
              {% elsif jl_id != blank %}
                <img
                  class="jens-linnea__image"
                  src="https://i.ytimg.com/vi/{{ jl_id }}/hqdefault.jpg"
                  alt="{{ block.settings.image_alt }}"
                  loading="lazy"
                  width="480"
                  height="360"
                >
              {% endif %}

              {% if jl_id != blank %}
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
                <span class="jens-linnea__attr-sep">&middot;</span>
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
          "type": "text",
          "id": "video_url",
          "label": "YouTube link",
          "info": "Paste any YouTube link — Shorts, youtu.be or watch links all work. A play button appears on the image; visitors click it to watch right here."
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
          "default": "Jens StÃ¥lnacke"
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
          "default": "Read Jens' case â†’"
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

$mg = @'
﻿{{ 'drye-mechanics-identification-gallery.css' | asset_url | stylesheet_tag }}

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
          {%- assign mg_url = block.settings.video_url | strip -%}
          {%- assign mg_id = '' -%}
          {%- if mg_url != blank -%}
            {%- if mg_url contains 'shorts/' -%}
              {%- assign mg_id = mg_url | split: 'shorts/' | last | split: '?' | first | split: '/' | first -%}
            {%- elsif mg_url contains 'youtu.be/' -%}
              {%- assign mg_id = mg_url | split: 'youtu.be/' | last | split: '?' | first | split: '/' | first -%}
            {%- elsif mg_url contains 'embed/' -%}
              {%- assign mg_id = mg_url | split: 'embed/' | last | split: '?' | first | split: '/' | first -%}
            {%- elsif mg_url contains 'v=' -%}
              {%- assign mg_id = mg_url | split: 'v=' | last | split: '&' | first -%}
            {%- else -%}
              {%- assign mg_id = mg_url | split: '/' | last | split: '?' | first -%}
            {%- endif -%}
          {%- endif -%}
          <article class="mech-gallery__panel" {{ block.shopify_attributes }}>
            <div
              class="mech-gallery__img{% if mg_id != blank %} mech-gallery__img--video{% endif %}"
              {% if mg_id != blank %}data-mg-video="{{ mg_id }}"{% endif %}
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
              {% elsif mg_id != blank %}
                <img
                  class="mech-gallery__img-el"
                  src="https://i.ytimg.com/vi/{{ mg_id }}/hqdefault.jpg"
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

              {% if mg_id != blank %}
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
          "type": "text",
          "id": "video_url",
          "label": "YouTube link",
          "info": "Paste any YouTube link — Shorts, youtu.be or watch links all work. A play button appears on the image; visitors click it to watch right here."
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

$utf8 = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'sections/jens-linnea-section.liquid'), $jl + "`n", $utf8)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'sections/drye-mechanics-identification-gallery.liquid'), $mg + "`n", $utf8)

$a = Select-String -Path 'sections/jens-linnea-section.liquid' -Pattern 'jl_id' -Quiet
$b = Select-String -Path 'sections/drye-mechanics-identification-gallery.liquid' -Pattern 'mg_id' -Quiet
if ($a -and $b) { Write-Host ''; Write-Host 'KLART! Bada sektioner accepterar nu shorts-lankar.' -ForegroundColor Green }
else { Write-Host 'FEL: verifiering misslyckades.' -ForegroundColor Red }
