/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { getEncoder } from '../../../../FlowHelpers/1.0.0/hardwareUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */
const details = (): IpluginDetails => ({
  name: 'Set Video Encoder',
  description: 'Set the video encoder for all streams',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      name: 'outputCodec',
      type: 'string',
      defaultValue: 'hevc',
      inputUI: {
        type: 'dropdown',
        options: [
          'hevc',
          // 'vp9',
          'h264',
          // 'vp8',
          'av1',
        ],
      },
      tooltip: 'Specify codec of the output file',
    },
    {
      name: 'ffmpegPreset',
      type: 'string',
      defaultValue: 'fast',
      inputUI: {
        type: 'dropdown',
        options: [
          'veryslow',
          'slower',
          'slow',
          'medium',
          'fast',
          'faster',
          'veryfast',
          'superfast',
          'ultrafast',
        ],
      },
      tooltip: 'Specify ffmpeg preset',
    },
    {
      name: 'ffmpegQuality',
      type: 'number',
      defaultValue: '25',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify ffmpeg quality',
    },
    {
      name: 'hardwareEncoding',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Specify whether to use hardware encoding if available',
    },
    {
      name: 'hardwareType',
      type: 'string',
      defaultValue: 'auto',
      inputUI: {
        type: 'dropdown',
        options: [
          'auto',
          'nvenc',
          'qsv',
          'vaapi',
          'videotoolbox',
        ],
      },
      tooltip: 'Specify codec of the output file',
    },
    {
      name: 'hardwareDecoding',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Specify whether to use hardware decoding if available',
    },
    {
      name: 'forceEncoding',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Specify whether to force encoding if stream already has the target codec',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const hardwareDecoding = args.inputs.hardwareDecoding === true;
  const hardwareType = String(args.inputs.hardwareType);
  args.variables.ffmpegCommand.hardwareDecoding = hardwareDecoding;

  for (let i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
    const stream = args.variables.ffmpegCommand.streams[i];

    if (stream.codec_type === 'video') {
      const targetCodec = String(args.inputs.outputCodec);
      const ffmpegPreset = String(args.inputs.ffmpegPreset);
      const ffmpegQuality = String(args.inputs.ffmpegQuality);
      const forceEncoding = args.inputs.forceEncoding === true;
      const hardwarEncoding = args.inputs.hardwareEncoding === true;

      if (
        forceEncoding
        || stream.codec_name !== targetCodec
      ) {
        args.variables.ffmpegCommand.shouldProcess = true;

        // eslint-disable-next-line no-await-in-loop
        const encoderProperties = await getEncoder({
          targetCodec,
          hardwareEncoding: hardwarEncoding,
          hardwareType,
          args,
        });

        stream.outputArgs.push('-c:{outputIndex}', encoderProperties.encoder);

        if (encoderProperties.isGpu) {
          stream.outputArgs.push('-qp', ffmpegQuality);
        } else {
          stream.outputArgs.push('-crf', ffmpegQuality);
        }

        if (targetCodec !== 'av1' && ffmpegPreset) {
          stream.outputArgs.push('-preset', ffmpegPreset);
        }

        if (hardwareDecoding) {
          stream.inputArgs.push(...encoderProperties.inputArgs);
        }

        if (encoderProperties.outputArgs) {
          stream.outputArgs.push(...encoderProperties.outputArgs);
        }
      }
    }
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
