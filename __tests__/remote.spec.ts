/// <reference path="../src/types/module.d.ts" />

import configParser from 'parse-git-config'
import { getRemoteUrl } from '../src/remote'
import { ERR_MSG } from '../src/constant'

jest.mock('parse-git-config')

describe('getRemoteUrl', () => {
  let mockedGetConfigSync = <jest.Mock<any>>configParser.sync

  it('get url of git project', () => {
    const value = {
      'remote "origin"': {
        url: 'git@github.com:roshanca/xxx.git'
      }
    }

    mockedGetConfigSync.mockReturnValue(value)

    expect(getRemoteUrl()).toBe('https://github.com/roshanca/xxx')
  })
})
