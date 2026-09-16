Pod::Spec.new do |s|
  s.name           = 'ExpoDesertAntEar'
  s.version        = '1.0.0'
  s.summary        = 'On-device spoken language identification via Desert Ant Ear'
  s.description    = 'Wraps Desert Ant Ear so Veno can pick a Whisper language before transcription.'
  s.author         = 'Veno'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '18.0',
    :tvos => '18.0'
  }
  s.swift_version  = '6.2'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  s.exclude_files = "AppTarget/**/*"
end
